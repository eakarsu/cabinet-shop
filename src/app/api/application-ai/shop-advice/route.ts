import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRuntimeUser } from "@/lib/runtime-auth";

export async function POST(request: NextRequest) {
  const startedAt = Date.now();
  let user;
  try { user = await requireRuntimeUser(request); }
  catch { return NextResponse.json({ error: "Authentication required." }, { status: 401 }); }
  if (user.role !== "admin") return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  const body = await request.json().catch(() => ({}));
  const prompt = String(body.prompt || "").trim();
  if (prompt.length < 20 || prompt.length > 12000) return NextResponse.json({ error: "prompt must contain 20 to 12000 characters." }, { status: 422 });
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL;
  const baseUrl = process.env.OPENROUTER_BASE_URL;
  if (!apiKey || !model || baseUrl !== "https://openrouter.ai/api/v1") return NextResponse.json({ error: "OpenRouter is not configured." }, { status: 503 });
  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json", "http-referer": process.env.NEXTAUTH_URL || "http://127.0.0.1", "x-title": "Heritage Cabinet & Stone" },
      body: JSON.stringify({ model, messages: [
        { role: "system", content: "You are a bounded cabinet-shop operations advisor. Require human review, licensed material provenance, deterministic cost and safety limits, and never execute purchases or customer outreach." },
        { role: "user", content: prompt },
      ], temperature: 0.2, max_tokens: 1800 }),
      signal: AbortSignal.timeout(Number(process.env.OPENROUTER_TIMEOUT_MS || 180000)),
    });
    if (!response.ok) throw new Error(`OpenRouter returned ${response.status}`);
    const payload = await response.json();
    const result = payload?.choices?.[0]?.message?.content;
    const providerReceipt = response.headers.get("x-request-id") || payload?.id;
    if (typeof result !== "string" || !result.trim() || !providerReceipt) throw new Error("OpenRouter returned an incomplete response");
    const saved = await prisma.aiResult.create({ data: { feature: "runtime_shop_advice", model: payload.model || model, userId: user.id, providerReceipt, result, input: { bytes: Buffer.byteLength(prompt) }, output: { bytes: Buffer.byteLength(result) }, durationMs: Date.now() - startedAt } });
    return NextResponse.json({ id: saved.id, model: saved.model, result, usage: payload.usage || {} });
  } catch { return NextResponse.json({ error: "OpenRouter request failed." }, { status: 502 }); }
}
