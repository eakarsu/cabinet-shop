import { NextRequest, NextResponse } from "next/server";
import { consumeRateLimit, requestSubject } from "@/lib/rate-limit";
import { PolicyError } from "@/lib/sales-policy";
import { recordSuppression } from "@/lib/sales-workflow";

export async function POST(req: NextRequest) {
  const budget = await consumeRateLimit("privacy-preference", requestSubject(req), 10, 60 * 60 * 1000);
  if (!budget.allowed) return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  const body = await req.json().catch(() => ({}));
  if (body.action !== "opt_out") {
    return NextResponse.json({ error: "Public preference changes support opt-out only; opt-in requires verified consent." }, { status: 422 });
  }
  try {
    await recordSuppression({ channel: body.channel, value: body.value, reason: body.reason, region: body.region });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const status = error instanceof PolicyError ? error.status : 500;
    return NextResponse.json({ error: status === 500 ? "Unable to save preference." : (error as Error).message }, { status });
  }
}

