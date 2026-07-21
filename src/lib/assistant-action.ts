import { createHmac, timingSafeEqual } from "node:crypto";

type ActionEnvelope = {
  name: string;
  args: Record<string, unknown>;
  subject: string;
  expiresAt: number;
};

function secret() {
  const value = process.env.INTERNAL_API_TOKEN || process.env.NEXTAUTH_SECRET;
  if (!value) throw new Error("Assistant action signing is not configured.");
  return value;
}

export function issueAssistantAction(name: string, args: Record<string, unknown>, subject: string) {
  const envelope: ActionEnvelope = { name, args, subject, expiresAt: Date.now() + 10 * 60 * 1000 };
  const payload = Buffer.from(JSON.stringify(envelope)).toString("base64url");
  const signature = createHmac("sha256", secret()).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

export function verifyAssistantAction(token: unknown, subject: string): ActionEnvelope {
  const [payload, supplied] = String(token || "").split(".");
  if (!payload || !supplied) throw new Error("Confirmation is invalid or expired.");
  const expected = createHmac("sha256", secret()).update(payload).digest();
  const actual = Buffer.from(supplied, "base64url");
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) throw new Error("Confirmation is invalid or expired.");
  const envelope = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as ActionEnvelope;
  if (envelope.subject !== subject || envelope.expiresAt < Date.now() || typeof envelope.name !== "string" || typeof envelope.args !== "object") {
    throw new Error("Confirmation is invalid or expired.");
  }
  return envelope;
}

