import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export const LEAD_STATUSES = [
  "new",
  "qualified",
  "assigned",
  "contacted",
  "consultation_scheduled",
  "proposal",
  "approval_pending",
  "won",
  "lost",
] as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const ACCOUNT_STATUSES = ["prospect", "qualified", "customer", "dormant"] as const;
const ACCOUNT_TRANSITIONS: Record<string, readonly string[]> = {
  prospect: ["qualified", "dormant"],
  qualified: ["customer", "dormant"],
  customer: ["dormant"],
  dormant: ["qualified"],
};

const TRANSITIONS: Record<LeadStatus, readonly LeadStatus[]> = {
  new: ["qualified", "lost"],
  qualified: ["assigned", "lost"],
  assigned: ["contacted", "consultation_scheduled", "lost"],
  contacted: ["consultation_scheduled", "proposal", "lost"],
  consultation_scheduled: ["proposal", "won", "lost"],
  proposal: ["approval_pending", "lost"],
  approval_pending: ["proposal", "won", "lost"],
  won: [],
  lost: ["qualified"],
};

export class PolicyError extends Error {
  constructor(message: string, readonly status = 422) {
    super(message);
  }
}

export function normalizeEmail(value: unknown): string {
  const email = String(value ?? "").trim().toLowerCase();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new PolicyError("A valid email address is required.");
  }
  return email;
}

export function normalizePhone(value: unknown): string {
  const raw = String(value ?? "").trim();
  const digits = raw.replace(/\D/g, "");
  if (digits.length < 7 || digits.length > 15) {
    throw new PolicyError("A valid phone number is required.");
  }
  return `+${digits}`;
}

export function normalizeRegion(value: unknown): string {
  const region = String(value ?? "US").trim().toUpperCase();
  if (!/^[A-Z]{2,3}(-[A-Z0-9]{1,3})?$/.test(region)) {
    throw new PolicyError("Region must be an ISO-style country or regional code.");
  }
  return region;
}

export function cleanText(value: unknown, max: number): string | null {
  const text = String(value ?? "").replace(/[\u0000-\u001f\u007f]/g, " ").trim();
  if (!text) return null;
  return text.slice(0, max);
}

export function identityKey(email: string | null, phone: string | null): string {
  if (!email && !phone) throw new PolicyError("An email or phone identity is required.");
  return createHash("sha256").update(`${email ?? ""}|${phone ?? ""}`).digest("hex");
}

export function buildDedupeKey(
  kind: "quote" | "consultation",
  identity: string,
  payload: Record<string, unknown>,
  suppliedKey?: string | null,
  now = Date.now()
): string {
  if (suppliedKey) {
    const safe = suppliedKey.trim();
    if (!/^[A-Za-z0-9._:-]{8,128}$/.test(safe)) {
      throw new PolicyError("Idempotency-Key must be 8-128 safe characters.", 400);
    }
    return `${kind}:client:${createHash("sha256").update(safe).digest("hex")}`;
  }
  const bucket = Math.floor(now / (15 * 60 * 1000));
  const canonical = JSON.stringify(
    Object.fromEntries(Object.entries(payload).sort(([a], [b]) => a.localeCompare(b)))
  );
  return `${kind}:window:${createHash("sha256")
    .update(`${identity}|${bucket}|${canonical}`)
    .digest("hex")}`;
}

export function assertLeadTransition(
  from: string,
  to: string,
  context: { ownerId?: string | null; approvalState?: string; reason?: string | null }
): asserts to is LeadStatus {
  if (!LEAD_STATUSES.includes(from as LeadStatus) || !LEAD_STATUSES.includes(to as LeadStatus)) {
    throw new PolicyError("Unknown lead lifecycle state.");
  }
  if (!TRANSITIONS[from as LeadStatus].includes(to as LeadStatus)) {
    throw new PolicyError(`Lead cannot transition from ${from} to ${to}.`, 409);
  }
  if (["assigned", "contacted", "consultation_scheduled", "proposal", "won"].includes(to) && !context.ownerId) {
    throw new PolicyError(`An owner is required before moving a lead to ${to}.`, 409);
  }
  if (to === "won" && context.approvalState !== "approved") {
    throw new PolicyError("A second staff member must approve the proposal before it can be won.", 409);
  }
  if (to === "lost" && !context.reason?.trim()) {
    throw new PolicyError("A loss reason is required.");
  }
}

export function assertAccountTransition(from: string, to: string, ownerId?: string | null) {
  if (!ACCOUNT_STATUSES.includes(from as (typeof ACCOUNT_STATUSES)[number]) || !ACCOUNT_TRANSITIONS[from]?.includes(to)) {
    throw new PolicyError(`Account cannot transition from ${from} to ${to}.`, 409);
  }
  if (["qualified", "customer"].includes(to) && !ownerId) {
    throw new PolicyError("An owner is required before qualifying an account.", 409);
  }
}

export function hashPrivateValue(value: string): string {
  const secret = process.env.PRIVACY_HASH_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret && process.env.NODE_ENV === "production") {
    throw new Error("PRIVACY_HASH_SECRET is required in production.");
  }
  return createHmac("sha256", secret || "local-development-only")
    .update(value)
    .digest("hex");
}

export function signPayload(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

export function verifySignature(payload: string, supplied: string | null, secret: string): boolean {
  if (!supplied || !/^[a-f0-9]{64}$/i.test(supplied)) return false;
  const expected = Buffer.from(signPayload(payload, secret), "hex");
  const actual = Buffer.from(supplied, "hex");
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
