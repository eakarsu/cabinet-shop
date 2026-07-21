import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createHash } from "node:crypto";
import { consumeRateLimit, requestSubject } from "@/lib/rate-limit";
import { getCaller, isAdmin } from "@/lib/api-guard";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL =
  process.env.OPENROUTER_MODEL || "anthropic/claude-3-5-sonnet-20241022";

// Named AI helpers used across the admin + customer dashboards.
const FEATURES: Record<string, { system: string }> = {
  lead_summary: {
    system:
      "You are a sales assistant for a cabinet & stone countertop company. Given a lead's details, write a 2-3 sentence summary and a clear recommended next step. Be concise and practical.",
  },
  lead_reply: {
    system:
      "You are a friendly sales rep for Heritage Cabinet & Stone. Draft a short, warm email reply to this lead that acknowledges their project, answers likely questions, and proposes booking a free in-home consultation. Keep it under 120 words. Sign off as 'The Heritage Team'.",
  },
  design_ideas: {
    system:
      "You are an interior design assistant for a kitchen & bath remodeler specializing in granite, quartz, marble, and custom cabinetry. Given the customer's description, suggest 3 concrete design directions (material + cabinet + edge/finish combinations) with a one-line reason each. Be specific and encouraging.",
  },
  material_recommender: {
    system:
      "You are a stone & cabinetry expert. Based on the customer's needs (budget, style, durability, maintenance), recommend the best material type (granite, quartz, or marble) and 1-2 specific looks, with a short why. Mention trade-offs honestly.",
  },
};

export async function POST(request: NextRequest) {
  const t0 = Date.now();
  if (!OPENROUTER_API_KEY) {
    return NextResponse.json(
      { error: "AI is unavailable — OPENROUTER_API_KEY is not set." },
      { status: 503 }
    );
  }

  const rateKey = requestSubject(request);
  if (!(await consumeRateLimit("ai-helper", rateKey, 20, 60 * 60 * 1000)).allowed) {
    return NextResponse.json(
      { error: "AI request limit reached. Try again later." },
      { status: 429 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const feature = String(body.feature || "");
  const prompt = String(body.prompt || "").slice(0, 4000);
  const cfg = FEATURES[feature];
  if (!cfg) {
    return NextResponse.json({ error: "Unknown AI feature." }, { status: 400 });
  }
  if (!prompt.trim()) {
    return NextResponse.json({ error: "Nothing to work with." }, { status: 422 });
  }
  if (["lead_summary", "lead_reply"].includes(feature) && !isAdmin(await getCaller(request))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXTAUTH_URL || "http://localhost:3000",
        "X-Title": "Heritage Cabinet & Stone AI",
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages: [
          { role: "system", content: cfg.system },
          { role: "user", content: prompt },
        ],
        temperature: 0.6,
        max_tokens: 600,
      }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) {
      throw new Error(`OpenRouter returned ${res.status}.`);
    }
    const json = await res.json();
    const text = json.choices?.[0]?.message?.content ?? "";

    await prisma.aiResult
      .create({
        data: {
          feature,
          model: OPENROUTER_MODEL,
          input: { digest: createHash("sha256").update(prompt).digest("hex"), bytes: Buffer.byteLength(prompt) } as any,
          output: { bytes: Buffer.byteLength(text) } as any,
          durationMs: Date.now() - t0,
        },
      })
      .catch(() => {});

    return NextResponse.json({ text });
  } catch (_error) {
    await prisma.aiResult
      .create({
        data: {
          feature,
          model: OPENROUTER_MODEL,
          error: "provider_or_validation_error",
          durationMs: Date.now() - t0,
        },
      })
      .catch(() => {});
    return NextResponse.json(
      { error: "The AI ran into a problem. Please try again." },
      { status: 500 }
    );
  }
}
