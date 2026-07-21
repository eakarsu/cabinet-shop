import { beforeAll, beforeEach, afterAll, describe, expect, it } from "vitest";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import {
  approveQuote,
  assignQuote,
  contactability,
  conversionMetrics,
  createConsultation,
  createOutreachDraft,
  createQuote,
  recordSuppression,
  reviewOutreach,
  transitionQuote,
} from "@/lib/sales-workflow";
import { processNextIntegrationEvent } from "@/lib/integration-worker";

function assertTestDatabase() {
  const database = new URL(process.env.DATABASE_URL || "").pathname;
  if (!database.includes("test")) throw new Error("Integration tests require a database whose name contains 'test'.");
}

async function clean() {
  await prisma.$transaction([
    prisma.integrationLink.deleteMany(), prisma.integrationEvent.deleteMany(), prisma.integrationEndpoint.deleteMany(),
    prisma.outreachMessage.deleteMany(), prisma.attributionTouch.deleteMany(), prisma.consentRecord.deleteMany(),
    prisma.suppressionEntry.deleteMany(), prisma.privacyRequest.deleteMany(), prisma.auditEvent.deleteMany(),
    prisma.quoteRequest.deleteMany(), prisma.consultation.deleteMany(), prisma.contact.deleteMany(), prisma.account.deleteMany(),
    prisma.rateLimitBucket.deleteMany(), prisma.user.deleteMany(),
  ]);
}

beforeAll(assertTestDatabase);
beforeEach(clean);
afterAll(async () => { await clean(); await prisma.$disconnect(); });

describe("governed sales workflow", () => {
  it("deduplicates identity and inquiries while preserving consent and attribution", async () => {
    const input = { name: "Taylor Rivera", email: "Taylor@Example.com", phone: "(555) 111-2222", material: "Quartz", source: "website", region: "US", idempotencyKey: "quote-request-0001" };
    const first = await createQuote(input);
    const duplicate = await createQuote({ ...input, material: "Granite" });
    expect(first.created).toBe(true);
    expect(duplicate.created).toBe(false);
    expect(duplicate.quote.id).toBe(first.quote.id);
    expect(await prisma.contact.count()).toBe(1);
    expect(await prisma.consentRecord.count({ where: { status: "granted", purpose: "sales_follow_up" } })).toBe(1);
    expect(await prisma.attributionTouch.count()).toBe(1);
  });

  it("requires ownership and independent approval before a win", async () => {
    const password = await bcrypt.hash("strong-test-password", 4);
    const [owner, reviewer] = await Promise.all([
      prisma.user.create({ data: { email: "owner@example.com", password, name: "Owner", role: "admin" } }),
      prisma.user.create({ data: { email: "reviewer@example.com", password, name: "Reviewer", role: "admin" } }),
    ]);
    let quote = (await createQuote({ name: "Morgan Lee", email: "morgan@example.com", phone: "5553334444", idempotencyKey: "quote-request-0002" })).quote;
    quote = await transitionQuote(quote.id, "qualified", owner.id, quote.version);
    quote = await assignQuote(quote.id, owner.id, owner.id, quote.version);
    quote = await transitionQuote(quote.id, "contacted", owner.id, quote.version);
    quote = await transitionQuote(quote.id, "proposal", owner.id, quote.version);
    await expect(approveQuote(quote.id, owner.id, quote.version)).rejects.toThrow(/own/i);
    quote = await approveQuote(quote.id, reviewer.id, quote.version);
    quote = await transitionQuote(quote.id, "won", owner.id, quote.version);
    expect(quote.status).toBe("won");
    expect(quote.closedAt).not.toBeNull();
    expect(await prisma.auditEvent.count({ where: { entityId: quote.id } })).toBeGreaterThanOrEqual(6);
  });

  it("blocks suppressed outreach and retries connector failures without sending", async () => {
    const password = await bcrypt.hash("strong-test-password", 4);
    const [author, reviewer] = await Promise.all([
      prisma.user.create({ data: { email: "author@example.com", password, role: "admin" } }),
      prisma.user.create({ data: { email: "second@example.com", password, role: "admin" } }),
    ]);
    const quote = (await createQuote({ name: "Casey Kim", email: "casey@example.com", phone: "5557778888", idempotencyKey: "quote-request-0003" })).quote;
    const draft = await createOutreachDraft({ quoteId: quote.id, contactId: quote.contactId!, channel: "email", body: "Your requested project follow-up", createdById: author.id });
    expect(draft.status).toBe("pending_review");
    await expect(reviewOutreach(draft.id, author.id, "approve")).rejects.toThrow(/author/i);
    await prisma.integrationEndpoint.create({ data: { name: "failing-email", provider: "test", category: "email", baseUrl: "http://127.0.0.1:9", enabled: true } });
    const approved = await reviewOutreach(draft.id, reviewer.id, "approve");
    expect(approved.status).toBe("approved");
    expect(await processNextIntegrationEvent()).toBe(true);
    expect((await prisma.integrationEvent.findFirst())?.status).toBe("retry");
    await recordSuppression({ channel: "email", value: "casey@example.com", source: "test" });
    expect(await contactability(quote.contactId!, "email", "sales_follow_up")).toMatchObject({ allowed: false, reason: "suppressed" });
    const blocked = await createOutreachDraft({ quoteId: quote.id, contactId: quote.contactId!, channel: "email", body: "Must not send", createdById: author.id });
    expect(blocked.status).toBe("blocked");
  });

  it("deduplicates bookings and rejects occupied slots", async () => {
    const date = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const input = { name: "Jordan Bell", email: "jordan@example.com", phone: "5552223333", date, time: "10:30", idempotencyKey: "consult-request-0001" };
    const first = await createConsultation(input);
    const duplicate = await createConsultation(input);
    expect(first.created).toBe(true);
    expect(duplicate.created).toBe(false);
    await expect(createConsultation({ ...input, name: "Other Person", email: "other@example.com", phone: "5559990000", idempotencyKey: "consult-request-0002" })).rejects.toThrow(/no longer available/i);
  });

  it("reports conversion and operational data quality", async () => {
    await createQuote({ name: "Metrics Lead", email: "metrics@example.com", phone: "5551239999", idempotencyKey: "quote-request-0004" });
    const metrics = await conversionMetrics();
    expect(metrics.leads).toBe(1);
    expect(metrics.byStatus.new).toBe(1);
    expect(metrics.dataQuality.contacts).toBe(1);
  });
});

