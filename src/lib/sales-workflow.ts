import { Prisma, type Contact, type QuoteRequest } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  PolicyError,
  assertLeadTransition,
  buildDedupeKey,
  cleanText,
  hashPrivateValue,
  identityKey,
  normalizeEmail,
  normalizePhone,
  normalizeRegion,
} from "@/lib/sales-policy";

type Tx = Prisma.TransactionClient;

const SOURCE_ALLOWLIST = new Set(["website", "ai_assistant", "crm", "email", "phone", "referral"]);

function source(value: unknown) {
  const candidate = String(value ?? "website").toLowerCase();
  return SOURCE_ALLOWLIST.has(candidate) ? candidate : "website";
}

async function findOrCreateContact(
  tx: Tx,
  input: { name: string; email?: string | null; phone?: string | null; region: string }
): Promise<Contact> {
  const conditions: Prisma.ContactWhereInput[] = [];
  if (input.email) conditions.push({ normalizedEmail: input.email });
  if (input.phone) conditions.push({ normalizedPhone: input.phone });
  const existing = conditions.length ? await tx.contact.findFirst({ where: { OR: conditions } }) : null;
  if (existing) {
    return tx.contact.update({
      where: { id: existing.id },
      data: {
        name: input.name || existing.name,
        normalizedEmail: existing.normalizedEmail || input.email,
        normalizedPhone: existing.normalizedPhone || input.phone,
        region: input.region,
      },
    });
  }
  const key = identityKey(input.email ?? null, input.phone ?? null);
  return tx.contact.upsert({
    where: { identityKey: key },
    create: {
      identityKey: key,
      normalizedEmail: input.email,
      normalizedPhone: input.phone,
      name: input.name,
      region: input.region,
    },
    update: {
      name: input.name,
      normalizedEmail: input.email,
      normalizedPhone: input.phone,
      region: input.region,
    },
  });
}

async function enqueueForCategory(
  tx: Tx,
  categories: string[],
  eventType: string,
  entityType: string,
  entityId: string,
  payload: Prisma.InputJsonValue
) {
  const endpoints = await tx.integrationEndpoint.findMany({
    where: {
      enabled: true,
      category: { in: categories },
      direction: { in: ["outbound", "bidirectional"] },
    },
    select: { id: true },
  });
  if (!endpoints.length) return;
  await tx.integrationEvent.createMany({
    data: endpoints.map((endpoint) => ({
      endpointId: endpoint.id,
      direction: "outbound",
      eventType,
      entityType,
      entityId,
      idempotencyKey: `${endpoint.id}:${eventType}:${entityId}`,
      payload,
    })),
    skipDuplicates: true,
  });
}

export type CreateQuoteInput = {
  name: unknown;
  email: unknown;
  phone: unknown;
  projectType?: unknown;
  material?: unknown;
  zip?: unknown;
  message?: unknown;
  source?: unknown;
  region?: unknown;
  campaign?: unknown;
  medium?: unknown;
  landingUrl?: unknown;
  referrer?: unknown;
  idempotencyKey?: string | null;
};

export async function createQuote(input: CreateQuoteInput) {
  const name = cleanText(input.name, 120);
  if (!name) throw new PolicyError("Name is required.");
  const email = normalizeEmail(input.email);
  const phone = normalizePhone(input.phone);
  const region = normalizeRegion(input.region);
  const leadSource = source(input.source);
  const projectType = cleanText(input.projectType, 120);
  const material = cleanText(input.material, 120);
  const zip = cleanText(input.zip, 24);
  const message = cleanText(input.message, 4000);
  const key = buildDedupeKey(
    "quote",
    identityKey(email, phone),
    { projectType, material, zip, message },
    input.idempotencyKey
  );

  return prisma.$transaction(async (tx) => {
    const duplicate = await tx.quoteRequest.findUnique({ where: { dedupeKey: key } });
    if (duplicate) return { quote: duplicate, created: false };

    const contact = await findOrCreateContact(tx, { name, email, phone, region });
    const quote = await tx.quoteRequest.create({
      data: {
        name,
        email,
        phone,
        normalizedEmail: email,
        normalizedPhone: phone,
        projectType,
        material,
        zip,
        message,
        source: leadSource,
        firstTouchSource: leadSource,
        lastTouchSource: leadSource,
        campaign: cleanText(input.campaign, 160),
        region,
        dedupeKey: key,
        contactId: contact.id,
      },
    });
    await tx.consentRecord.upsert({
      where: {
        contactId_channel_purpose: {
          contactId: contact.id,
          channel: "email",
          purpose: "sales_follow_up",
        },
      },
      create: {
        contactId: contact.id,
        channel: "email",
        purpose: "sales_follow_up",
        status: "granted",
        lawfulBasis: "requested_service",
        region,
        source: leadSource,
        evidence: { notice: "project_contact", quoteId: quote.id },
      },
      update: {
        status: "granted",
        lawfulBasis: "requested_service",
        region,
        source: leadSource,
        recordedAt: new Date(),
        evidence: { notice: "project_contact", quoteId: quote.id },
      },
    });
    await tx.attributionTouch.create({
      data: {
        quoteId: quote.id,
        contactId: contact.id,
        source: leadSource,
        medium: cleanText(input.medium, 80),
        campaign: cleanText(input.campaign, 160),
        landingUrl: cleanText(input.landingUrl, 1000),
        referrer: cleanText(input.referrer, 1000),
      },
    });
    await tx.auditEvent.create({
      data: { action: "quote.created", entityType: "QuoteRequest", entityId: quote.id, metadata: { source: leadSource, region } },
    });
    await enqueueForCategory(tx, ["crm", "enrichment"], "quote.created", "QuoteRequest", quote.id, {
      quoteId: quote.id,
      contactId: contact.id,
      status: quote.status,
      source: leadSource,
      region,
    });
    return { quote, created: true };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

export type CreateConsultationInput = {
  name: unknown;
  email?: unknown;
  phone: unknown;
  date: unknown;
  time: unknown;
  projectType?: unknown;
  material?: unknown;
  address?: unknown;
  notes?: unknown;
  source?: unknown;
  region?: unknown;
  idempotencyKey?: string | null;
};

export async function createConsultation(input: CreateConsultationInput) {
  const name = cleanText(input.name, 120);
  if (!name) throw new PolicyError("Name is required.");
  const email = input.email ? normalizeEmail(input.email) : null;
  const phone = normalizePhone(input.phone);
  const region = normalizeRegion(input.region);
  const dateText = String(input.date ?? "");
  const time = String(input.time ?? "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateText) || !/^(09:00|10:30|13:00|14:30|16:00)$/.test(time)) {
    throw new PolicyError("Choose a valid consultation date and available time.");
  }
  const date = new Date(`${dateText}T12:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date < new Date(Date.now() - 24 * 60 * 60 * 1000)) {
    throw new PolicyError("Consultation date must be today or later.");
  }
  const key = buildDedupeKey(
    "consultation",
    identityKey(email, phone),
    { date: dateText, time },
    input.idempotencyKey
  );
  const bookingSource = source(input.source);

  return prisma.$transaction(async (tx) => {
    const duplicate = await tx.consultation.findUnique({ where: { dedupeKey: key } });
    if (duplicate) return { consultation: duplicate, created: false };
    const occupied = await tx.consultation.findFirst({
      where: { date, time, status: { not: "cancelled" } },
    });
    if (occupied) throw new PolicyError("That consultation slot is no longer available.", 409);
    const contact = await findOrCreateContact(tx, { name, email, phone, region });
    const consultation = await tx.consultation.create({
      data: {
        name,
        email,
        phone,
        date,
        time,
        projectType: cleanText(input.projectType, 120),
        material: cleanText(input.material, 120),
        address: cleanText(input.address, 500),
        notes: cleanText(input.notes, 2000),
        source: bookingSource,
        dedupeKey: key,
        contactId: contact.id,
      },
    });
    await tx.auditEvent.create({
      data: { action: "consultation.created", entityType: "Consultation", entityId: consultation.id, metadata: { source: bookingSource } },
    });
    await enqueueForCategory(tx, ["calendar", "crm"], "consultation.created", "Consultation", consultation.id, {
      consultationId: consultation.id,
      contactId: contact.id,
      date: date.toISOString(),
      time,
    });
    return { consultation, created: true };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

export async function assignQuote(id: string, ownerId: string, actorId: string, expectedVersion: number) {
  return prisma.$transaction(async (tx) => {
    const [quote, owner] = await Promise.all([
      tx.quoteRequest.findUnique({ where: { id } }),
      tx.user.findFirst({ where: { id: ownerId, active: true, role: "admin" } }),
    ]);
    if (!quote) throw new PolicyError("Lead not found.", 404);
    if (!owner) throw new PolicyError("Owner must be an active staff member.");
    if (quote.version !== expectedVersion) throw new PolicyError("Lead changed; refresh and try again.", 409);
    const updated = await tx.quoteRequest.update({
      where: { id, version: expectedVersion },
      data: {
        ownerId,
        handoffState: "accepted",
        status: quote.status === "qualified" ? "assigned" : quote.status === "approval_pending" ? "proposal" : quote.status,
        approvalState: quote.ownerId !== ownerId ? "not_required" : quote.approvalState,
        version: { increment: 1 },
      },
    });
    await tx.auditEvent.create({ data: { actorId, action: "quote.assigned", entityType: "QuoteRequest", entityId: id, metadata: { ownerId } } });
    await enqueueForCategory(tx, ["crm"], "quote.assigned", "QuoteRequest", id, { quoteId: id, ownerId });
    return updated;
  });
}

export async function approveQuote(id: string, reviewerId: string, expectedVersion: number) {
  return prisma.$transaction(async (tx) => {
    const quote = await tx.quoteRequest.findUnique({ where: { id } });
    if (!quote) throw new PolicyError("Lead not found.", 404);
    if (quote.version !== expectedVersion) throw new PolicyError("Lead changed; refresh and try again.", 409);
    if (!quote.ownerId) throw new PolicyError("Assign an owner before approval.", 409);
    if (quote.ownerId === reviewerId) throw new PolicyError("The lead owner cannot approve their own proposal.", 409);
    if (!["proposal", "approval_pending"].includes(quote.status)) throw new PolicyError("Only a proposal can be approved.", 409);
    const updated = await tx.quoteRequest.update({
      where: { id, version: expectedVersion },
      data: { approvalState: "approved", status: "approval_pending", version: { increment: 1 } },
    });
    await tx.auditEvent.create({ data: { actorId: reviewerId, action: "quote.approved", entityType: "QuoteRequest", entityId: id } });
    return updated;
  });
}

export async function transitionQuote(
  id: string,
  targetStatus: string,
  actorId: string,
  expectedVersion: number,
  reason?: string | null
) {
  return prisma.$transaction(async (tx) => {
    const quote = await tx.quoteRequest.findUnique({ where: { id } });
    if (!quote) throw new PolicyError("Lead not found.", 404);
    if (quote.version !== expectedVersion) throw new PolicyError("Lead changed; refresh and try again.", 409);
    assertLeadTransition(quote.status, targetStatus, {
      ownerId: quote.ownerId,
      approvalState: quote.approvalState,
      reason,
    });
    const updated = await tx.quoteRequest.update({
      where: { id, version: expectedVersion },
      data: {
        status: targetStatus,
        approvalState: targetStatus === "approval_pending" ? "pending" : ["qualified", "proposal"].includes(targetStatus) ? "not_required" : quote.approvalState,
        lostReason: targetStatus === "lost" ? cleanText(reason, 500) : null,
        closedAt: ["won", "lost"].includes(targetStatus) ? new Date() : null,
        handoffState: targetStatus === "contacted" ? "completed" : quote.handoffState,
        version: { increment: 1 },
      },
    });
    await tx.auditEvent.create({
      data: { actorId, action: "quote.transitioned", entityType: "QuoteRequest", entityId: id, metadata: { from: quote.status, to: targetStatus, reason: cleanText(reason, 500) } },
    });
    await enqueueForCategory(tx, ["crm"], "quote.transitioned", "QuoteRequest", id, { quoteId: id, from: quote.status, to: targetStatus });
    return updated;
  });
}

export async function recordSuppression(input: {
  channel: unknown;
  value: unknown;
  reason?: unknown;
  region?: unknown;
  source?: string;
}) {
  const channel = String(input.channel ?? "email").toLowerCase();
  if (!new Set(["email", "sms", "phone"]).has(channel)) throw new PolicyError("Unsupported channel.");
  const normalized = channel === "email" ? normalizeEmail(input.value) : normalizePhone(input.value);
  const valueHash = hashPrivateValue(normalized);
  const region = normalizeRegion(input.region);
  return prisma.$transaction(async (tx) => {
    const suppression = await tx.suppressionEntry.upsert({
      where: { channel_valueHash: { channel, valueHash } },
      create: { channel, valueHash, reason: cleanText(input.reason, 500) || "customer_opt_out", region, source: input.source || "privacy_form" },
      update: { active: true, reason: cleanText(input.reason, 500) || "customer_opt_out", region, source: input.source || "privacy_form" },
    });
    const contact = await tx.contact.findFirst({
      where: channel === "email" ? { normalizedEmail: normalized } : { normalizedPhone: normalized },
    });
    if (contact) {
      await tx.consentRecord.upsert({
        where: { contactId_channel_purpose: { contactId: contact.id, channel, purpose: "marketing" } },
        create: { contactId: contact.id, channel, purpose: "marketing", status: "denied", lawfulBasis: "withdrawn", region, source: input.source || "privacy_form" },
        update: { status: "denied", lawfulBasis: "withdrawn", region, source: input.source || "privacy_form", recordedAt: new Date() },
      });
      await tx.contact.update({ where: { id: contact.id }, data: { marketingStatus: "suppressed" } });
    }
    await tx.auditEvent.create({ data: { action: "contact.suppressed", entityType: "SuppressionEntry", entityId: suppression.id, metadata: { channel, region } } });
    return suppression;
  });
}

export async function requestPrivacyAction(input: { value: unknown; requestType: unknown; region?: unknown }) {
  const email = normalizeEmail(input.value);
  const requestType = String(input.requestType ?? "access").toLowerCase();
  if (!new Set(["access", "delete", "correct"]).has(requestType)) throw new PolicyError("Unsupported privacy request.");
  const region = normalizeRegion(input.region);
  const contact = await prisma.contact.findFirst({ where: { normalizedEmail: email } });
  const dueDays = region.startsWith("US-CA") ? 45 : region === "EU" || region === "UK" ? 30 : 30;
  return prisma.privacyRequest.create({
    data: {
      contactId: contact?.id,
      requestType,
      region,
      requesterHash: hashPrivateValue(email),
      dueAt: new Date(Date.now() + dueDays * 24 * 60 * 60 * 1000),
    },
  });
}

export async function contactability(contactId: string, channel: "email" | "sms" | "phone", purpose: "marketing" | "sales_follow_up") {
  const contact = await prisma.contact.findUnique({
    where: { id: contactId },
    include: { consents: { where: { channel, purpose } } },
  });
  if (!contact) return { allowed: false, reason: "contact_missing" };
  const value = channel === "email" ? contact.normalizedEmail : contact.normalizedPhone;
  if (!value) return { allowed: false, reason: "channel_missing" };
  const suppression = await prisma.suppressionEntry.findUnique({
    where: { channel_valueHash: { channel, valueHash: hashPrivateValue(value) } },
  });
  if (suppression?.active) return { allowed: false, reason: "suppressed" };
  const consent = contact.consents[0];
  if (!consent || consent.status !== "granted" || (consent.expiresAt && consent.expiresAt < new Date())) {
    return { allowed: false, reason: "consent_missing" };
  }
  if (purpose === "marketing" && ["EU", "UK"].includes(contact.region) && consent.lawfulBasis !== "explicit_consent") {
    return { allowed: false, reason: "explicit_consent_required" };
  }
  return { allowed: true, reason: null, recipientHash: hashPrivateValue(value) };
}

export async function createOutreachDraft(input: {
  quoteId?: string;
  contactId: string;
  channel: "email" | "sms" | "phone";
  subject?: string;
  body: string;
  createdById: string;
}) {
  const allowed = await contactability(input.contactId, input.channel, "sales_follow_up");
  return prisma.outreachMessage.create({
    data: {
      quoteId: input.quoteId,
      contactId: input.contactId,
      channel: input.channel,
      recipientHash: allowed.recipientHash || "blocked",
      subject: cleanText(input.subject, 200),
      body: cleanText(input.body, 10_000) || "",
      createdById: input.createdById,
      status: allowed.allowed ? "pending_review" : "blocked",
      lastError: allowed.reason,
    },
  });
}

export async function reviewOutreach(id: string, reviewerId: string, decision: "approve" | "reject", reason?: string) {
  return prisma.$transaction(async (tx) => {
    const message = await tx.outreachMessage.findUnique({ where: { id } });
    if (!message) throw new PolicyError("Outreach draft not found.", 404);
    if (message.createdById === reviewerId) throw new PolicyError("The author cannot review their own outreach.", 409);
    if (message.status !== "pending_review") throw new PolicyError("Only pending outreach can be reviewed.", 409);
    if (decision === "reject" && !reason?.trim()) throw new PolicyError("A rejection reason is required.");
    const allowed = decision === "approve"
      ? await contactability(message.contactId, message.channel as "email" | "sms" | "phone", "sales_follow_up")
      : { allowed: false, reason: "rejected" };
    const status = decision === "approve" && allowed.allowed ? "approved" : decision === "reject" ? "rejected" : "blocked";
    const updated = await tx.outreachMessage.update({
      where: { id },
      data: { status, reviewedById: reviewerId, reviewedAt: new Date(), rejectionReason: cleanText(reason, 500), lastError: allowed.reason },
    });
    if (status === "approved") {
      await enqueueForCategory(tx, [message.channel === "email" ? "email" : "crm"], "outreach.approved", "OutreachMessage", id, { outreachId: id });
    }
    await tx.auditEvent.create({ data: { actorId: reviewerId, action: `outreach.${status}`, entityType: "OutreachMessage", entityId: id } });
    return updated;
  });
}

export async function conversionMetrics() {
  const [byStatus, totalContacts, suppressed, pendingSync, failedSync, pendingPrivacy] = await Promise.all([
    prisma.quoteRequest.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.contact.count(),
    prisma.suppressionEntry.count({ where: { active: true } }),
    prisma.integrationEvent.count({ where: { status: { in: ["pending", "processing", "retry"] } } }),
    prisma.integrationEvent.count({ where: { status: "failed" } }),
    prisma.privacyRequest.count({ where: { status: { not: "completed" } } }),
  ]);
  const counts = Object.fromEntries(byStatus.map((row) => [row.status, row._count._all]));
  const leads = Object.values(counts).reduce((sum, count) => sum + count, 0);
  const won = counts.won || 0;
  return {
    leads,
    won,
    conversionRate: leads ? Number(((won / leads) * 100).toFixed(2)) : 0,
    byStatus: counts,
    dataQuality: {
      contacts: totalContacts,
      suppressed,
      pendingSync,
      failedSync,
      pendingPrivacy,
    },
  };
}

export function publicQuote(quote: QuoteRequest) {
  return {
    id: quote.id,
    status: quote.status,
    createdAt: quote.createdAt,
    updatedAt: quote.updatedAt,
  };
}
