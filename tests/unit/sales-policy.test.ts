import { describe, expect, it } from "vitest";
import {
  PolicyError,
  assertAccountTransition,
  assertLeadTransition,
  buildDedupeKey,
  normalizeEmail,
  normalizePhone,
  signPayload,
  verifySignature,
} from "@/lib/sales-policy";
import { issueAssistantAction, verifyAssistantAction } from "@/lib/assistant-action";

describe("sales policy", () => {
  it("normalizes contact identity and rejects invalid input", () => {
    expect(normalizeEmail(" Person@Example.COM ")).toBe("person@example.com");
    expect(normalizePhone("(555) 123-4567")).toBe("+5551234567");
    expect(() => normalizeEmail("not-an-email")).toThrow(PolicyError);
    expect(() => normalizePhone("123")).toThrow(PolicyError);
  });

  it("uses client idempotency keys without exposing them", () => {
    const first = buildDedupeKey("quote", "identity", { material: "Quartz" }, "request-key-123");
    const second = buildDedupeKey("quote", "identity", { material: "Granite" }, "request-key-123");
    expect(first).toBe(second);
    expect(first).not.toContain("request-key-123");
  });

  it("enforces ownership, loss reasons, approval, and terminal states", () => {
    expect(() => assertLeadTransition("qualified", "assigned", {})).toThrow(/owner/i);
    expect(() => assertLeadTransition("new", "lost", {})).toThrow(/reason/i);
    expect(() => assertLeadTransition("won", "contacted", { ownerId: "u", approvalState: "approved" })).toThrow(/cannot transition/i);
    expect(() => assertLeadTransition("approval_pending", "won", { ownerId: "u", approvalState: "pending" })).toThrow(/approve/i);
    expect(() => assertLeadTransition("approval_pending", "won", { ownerId: "u", approvalState: "approved" })).not.toThrow();
  });

  it("enforces account ownership and lifecycle", () => {
    expect(() => assertAccountTransition("prospect", "qualified", null)).toThrow(/owner/i);
    expect(() => assertAccountTransition("prospect", "customer", "owner")).toThrow(/cannot transition/i);
    expect(() => assertAccountTransition("prospect", "qualified", "owner")).not.toThrow();
  });

  it("verifies webhook signatures without accepting malformed values", () => {
    const signature = signPayload("payload", "webhook-secret");
    expect(verifySignature("payload", signature, "webhook-secret")).toBe(true);
    expect(verifySignature("changed", signature, "webhook-secret")).toBe(false);
    expect(verifySignature("payload", "bad", "webhook-secret")).toBe(false);
  });

  it("binds assistant confirmations to the requester and signed arguments", () => {
    process.env.INTERNAL_API_TOKEN = "assistant-test-token-0123456789abcdef";
    const token = issueAssistantAction("submit_quote", { name: "Taylor" }, "visitor-a");
    expect(verifyAssistantAction(token, "visitor-a")).toMatchObject({ name: "submit_quote", args: { name: "Taylor" } });
    expect(() => verifyAssistantAction(token, "visitor-b")).toThrow(/invalid or expired/i);
    expect(() => verifyAssistantAction(`${token}x`, "visitor-a")).toThrow(/invalid or expired/i);
  });
});
