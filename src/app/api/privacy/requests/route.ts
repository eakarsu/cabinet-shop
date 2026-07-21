import { NextRequest, NextResponse } from "next/server";
import { consumeRateLimit, requestSubject } from "@/lib/rate-limit";
import { PolicyError } from "@/lib/sales-policy";
import { requestPrivacyAction } from "@/lib/sales-workflow";

export async function POST(req: NextRequest) {
  const budget = await consumeRateLimit("privacy-request", requestSubject(req), 5, 24 * 60 * 60 * 1000);
  if (!budget.allowed) return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  const body = await req.json().catch(() => ({}));
  try {
    const request = await requestPrivacyAction({ value: body.email, requestType: body.requestType, region: body.region });
    return NextResponse.json({ id: request.id, status: request.status, dueAt: request.dueAt }, { status: 202 });
  } catch (error) {
    const status = error instanceof PolicyError ? error.status : 500;
    return NextResponse.json({ error: status === 500 ? "Unable to create privacy request." : (error as Error).message }, { status });
  }
}

