import { Prisma, type IntegrationEvent } from "@prisma/client";
import { prisma } from "@/lib/db";
import { contactability, createConsultation, createQuote, recordSuppression } from "@/lib/sales-workflow";
import { consumeRateLimit } from "@/lib/rate-limit";

const MAX_ATTEMPTS = 6;

class DeferredDelivery extends Error {
  constructor(readonly availableAt: Date, message: string) { super(message); }
}

async function outboundPayload(event: IntegrationEvent) {
  if (event.entityType === "QuoteRequest" && event.entityId) {
    const quote = await prisma.quoteRequest.findUnique({
      where: { id: event.entityId },
      select: { id: true, name: true, email: true, phone: true, projectType: true, material: true, zip: true, source: true, status: true, ownerId: true, updatedAt: true },
    });
    return { eventType: event.eventType, quote };
  }
  if (event.entityType === "Consultation" && event.entityId) {
    const consultation = await prisma.consultation.findUnique({
      where: { id: event.entityId },
      select: { id: true, name: true, email: true, phone: true, date: true, time: true, projectType: true, status: true, ownerId: true, updatedAt: true },
    });
    return { eventType: event.eventType, consultation };
  }
  if (event.entityType === "OutreachMessage" && event.entityId) {
    const outreach = await prisma.outreachMessage.findUnique({
      where: { id: event.entityId },
      include: { contact: true },
    });
    if (!outreach || outreach.status !== "approved") throw new Error("Outreach is no longer approved.");
    const permission = await contactability(outreach.contactId, outreach.channel as "email" | "sms" | "phone", "sales_follow_up");
    if (!permission.allowed) {
      await prisma.outreachMessage.update({ where: { id: outreach.id }, data: { status: "blocked", lastError: permission.reason } });
      throw new Error(`Outreach blocked: ${permission.reason}`);
    }
    const recipientBudget = await consumeRateLimit("outreach-recipient", outreach.recipientHash, 3, 24 * 60 * 60 * 1000);
    if (!recipientBudget.allowed) throw new DeferredDelivery(recipientBudget.resetAt, "Recipient outreach cadence limit reached.");
    return {
      eventType: event.eventType,
      outreach: {
        id: outreach.id,
        channel: outreach.channel,
        recipient: outreach.channel === "email" ? outreach.contact.normalizedEmail : outreach.contact.normalizedPhone,
        subject: outreach.subject,
        body: outreach.body,
      },
    };
  }
  return { eventType: event.eventType, payload: event.payload };
}

async function processOutbound(event: IntegrationEvent) {
  const endpoint = await prisma.integrationEndpoint.findUnique({ where: { id: event.endpointId } });
  if (!endpoint?.enabled || !endpoint.baseUrl) throw new Error("Integration endpoint is disabled or missing a URL.");
  const connectorBudget = await consumeRateLimit(`connector:${endpoint.id}`, endpoint.id, endpoint.rateLimitPerMinute, 60 * 1000);
  if (!connectorBudget.allowed) throw new DeferredDelivery(connectorBudget.resetAt, "Connector rate limit reached.");
  const credential = endpoint.secretEnvKey ? process.env[endpoint.secretEnvKey] : undefined;
  if (endpoint.secretEnvKey && !credential) throw new Error(`Credential environment variable ${endpoint.secretEnvKey} is missing.`);
  const response = await fetch(endpoint.baseUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Idempotency-Key": event.idempotencyKey,
      ...(credential ? { Authorization: `Bearer ${credential}` } : {}),
    },
    body: JSON.stringify(await outboundPayload(event)),
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error(`Connector returned ${response.status}.`);
  const result = await response.json().catch(() => ({}));
  const externalId = String(result?.id || result?.externalId || "").slice(0, 500) || null;
  if (externalId && event.entityId) {
    await prisma.integrationLink.upsert({
      where: { endpointId_entityType_localId: { endpointId: endpoint.id, entityType: event.entityType, localId: event.entityId } },
      create: { endpointId: endpoint.id, entityType: event.entityType, localId: event.entityId, externalId },
      update: { externalId },
    });
  }
  if (event.entityType === "OutreachMessage" && event.entityId) {
    await prisma.outreachMessage.update({ where: { id: event.entityId }, data: { status: "sent", sentAt: new Date(), attempts: { increment: 1 }, lastError: null } });
  }
  if (event.entityType === "Consultation" && event.entityId && endpoint.category === "calendar") {
    await prisma.consultation.update({ where: { id: event.entityId }, data: { calendarEventId: externalId, handoffState: "completed", retryCount: 0, nextRetryAt: null } });
  }
}

async function processInbound(event: IntegrationEvent) {
  const payload = event.payload as Record<string, unknown>;
  if (event.eventType === "quote.upsert") {
    await createQuote({
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      projectType: payload.projectType,
      material: payload.material,
      zip: payload.zip,
      message: payload.message,
      region: payload.region,
      campaign: payload.campaign,
      source: "crm",
      idempotencyKey: event.idempotencyKey,
    });
  } else if (event.eventType === "consultation.upsert") {
    await createConsultation({
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      date: payload.date,
      time: payload.time,
      projectType: payload.projectType,
      material: payload.material,
      address: payload.address,
      notes: payload.notes,
      region: payload.region,
      source: "crm",
      idempotencyKey: event.idempotencyKey,
    });
  } else if (event.eventType === "suppression.upsert") {
    await recordSuppression({ channel: payload.channel, value: payload.value, reason: payload.reason, region: payload.region, source: "integration" });
  } else {
    throw new Error(`Unsupported inbound event ${event.eventType}.`);
  }
}

export async function processNextIntegrationEvent(now = new Date()): Promise<boolean> {
  const event = await prisma.$transaction(async (tx) => {
    const candidate = await tx.integrationEvent.findFirst({
      where: {
        status: { in: ["pending", "retry"] },
        availableAt: { lte: now },
        OR: [{ lockedAt: null }, { lockedAt: { lt: new Date(now.getTime() - 10 * 60 * 1000) } }],
      },
      orderBy: { createdAt: "asc" },
    });
    if (!candidate) return null;
    const claimed = await tx.integrationEvent.updateMany({
      where: { id: candidate.id, status: candidate.status, lockedAt: candidate.lockedAt },
      data: { status: "processing", lockedAt: now, attempts: { increment: 1 } },
    });
    if (claimed.count !== 1) return null;
    return tx.integrationEvent.findUnique({ where: { id: candidate.id } });
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  if (!event) return false;
  try {
    if (event.direction === "inbound") await processInbound(event);
    else await processOutbound(event);
    await prisma.integrationEvent.update({ where: { id: event.id }, data: { status: "succeeded", processedAt: new Date(), lockedAt: null, lastError: null } });
  } catch (error) {
    if (error instanceof DeferredDelivery) {
      await prisma.integrationEvent.update({
        where: { id: event.id },
        data: { status: "retry", attempts: { decrement: 1 }, availableAt: error.availableAt, lockedAt: null, lastError: error.message },
      });
      return true;
    }
    const terminal = event.attempts >= MAX_ATTEMPTS;
    const delayMinutes = Math.min(60, 2 ** Math.max(0, event.attempts - 1));
    await prisma.integrationEvent.update({
      where: { id: event.id },
      data: {
        status: terminal ? "failed" : "retry",
        availableAt: new Date(Date.now() + delayMinutes * 60 * 1000),
        lockedAt: null,
        lastError: (error instanceof Error ? error.message : String(error)).slice(0, 1000),
      },
    });
  }
  return true;
}

export async function drainIntegrationEvents(limit = 100) {
  let processed = 0;
  while (processed < limit && await processNextIntegrationEvent()) processed += 1;
  await prisma.rateLimitBucket.deleteMany({ where: { expiresAt: { lt: new Date() } } });
  return processed;
}
