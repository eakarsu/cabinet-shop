import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCaller, isPrivileged } from "@/lib/api-guard";
import { consumeRateLimit, requestSubject } from "@/lib/rate-limit";
import { createQuote, publicQuote } from "@/lib/sales-workflow";
import { PolicyError } from "@/lib/sales-policy";
import { notifyTeam } from "@/lib/notify";

export async function GET(req: NextRequest) {
  const caller = await getCaller(req);
  if (!caller.role) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const status = new URL(req.url).searchParams.get("status");
  const quotes = await prisma.quoteRequest.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(!isPrivileged(caller) ? { normalizedEmail: caller.email?.toLowerCase() } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return NextResponse.json(isPrivileged(caller) ? quotes : quotes.map(publicQuote));
}

export async function POST(req: NextRequest) {
  const budget = await consumeRateLimit("quote", requestSubject(req), 10, 60 * 60 * 1000);
  if (!budget.allowed) return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
  const body = await req.json().catch(() => null);
  if (body?.website) return NextResponse.json({ ok: true }, { status: 202 });
  try {
    const result = await createQuote({
      ...body,
      idempotencyKey: req.headers.get("idempotency-key"),
      landingUrl: req.headers.get("referer"),
    });
    if (result.created) {
      await notifyTeam(`New estimate request — ${result.quote.name}`, [
        `Lead ID: ${result.quote.id}`,
        `Project: ${result.quote.projectType ?? "—"}`,
        `Material: ${result.quote.material ?? "—"}`,
        `Source: ${result.quote.source}`,
      ]);
    }
    return NextResponse.json(publicQuote(result.quote), { status: result.created ? 201 : 200 });
  } catch (error) {
    const status = error instanceof PolicyError ? error.status : 500;
    return NextResponse.json({ error: status === 500 ? "Unable to submit request." : (error as Error).message }, { status });
  }
}
