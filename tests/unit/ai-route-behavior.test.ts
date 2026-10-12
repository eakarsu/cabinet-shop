import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({ create: vi.fn(), fetch: vi.fn() }));
vi.mock("@/lib/db", () => ({ prisma: { aiResult: { create: mocks.create } } }));
vi.mock("@/lib/rate-limit", () => ({ consumeRateLimit: async () => ({ allowed: true }), requestSubject: () => "fixture" }));
vi.mock("@/lib/api-guard", () => ({ getCaller: async () => ({ role: "admin", id: "fixture-admin" }), isAdmin: () => true }));
vi.mock("@/lib/assistant-tools", () => ({ ASSISTANT_TOOLS: [], TOOL_KIND: {}, toOpenRouterTools: () => [], runReadTool: vi.fn(), previewWrite: vi.fn(), commitWrite: vi.fn(), endpointCatalog: () => "", DAILY_SLOTS: [] }));
vi.mock("@/lib/assistant-action", () => ({ issueAssistantAction: vi.fn(), verifyAssistantAction: vi.fn() }));

beforeEach(() => {
  vi.resetModules();
  vi.stubEnv("OPENROUTER_API_KEY", "fixture-key");
  mocks.create.mockReset().mockResolvedValue({ id: "saved-fixture" });
  mocks.fetch.mockReset();
  vi.stubGlobal("fetch", mocks.fetch);
});

describe("AI routes with a controlled provider fixture", () => {
  it.each(["lead_summary", "lead_reply", "design_ideas", "material_recommender"])("returns 200 for %s and saves the provider response", async feature => {
    mocks.fetch.mockResolvedValue({ ok: true, json: async () => ({ id: "fixture-receipt", model: "fixture-model", choices: [{ message: { content: '{"summary":"Ready","verified":false,"count":0}' } }] }) });
    const { POST } = await import("@/app/api/ai/route");
    const response = await POST(new NextRequest("http://localhost/api/ai", { method: "POST", body: JSON.stringify({ feature, prompt: "A realistic cabinet and stone project." }) }));
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.text).toContain('"verified":false');
    expect(mocks.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ feature, result: body.text, providerReceipt: "fixture-receipt" }) }));
  });

  it("saves the concierge response and returns an honest service error without a 500", async () => {
    mocks.fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ choices: [{ message: { role: "assistant", content: '{"summary":"Plan","items":["Quartz"]}' } }] }) });
    const { POST } = await import("@/app/api/assistant/route");
    const request = () => new NextRequest("http://localhost/api/assistant", { method: "POST", body: JSON.stringify({ messages: [{ role: "user", content: "Compare materials" }] }) });
    const response = await POST(request());
    expect(response.status).toBe(200);
    expect((await response.json()).message).toContain('"items"');
    expect(mocks.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ feature: "assistant_chat", result: '{"summary":"Plan","items":["Quartz"]}' }) }));
    mocks.fetch.mockRejectedValueOnce(new Error("provider offline"));
    const unavailable = await POST(request());
    expect(unavailable.status).toBe(503);
    expect((await unavailable.json()).error).toMatch(/unavailable.*No response was generated/);
  });
});
