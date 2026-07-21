import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCaller, isAdmin, isPrivileged } from "@/lib/api-guard";
import { approveQuote, assignQuote, publicQuote, transitionQuote } from "@/lib/sales-workflow";
import { cleanText, PolicyError } from "@/lib/sales-policy";

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const caller = await getCaller(req);
  if (!caller.role) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const quote = await prisma.quoteRequest.findUnique({ where: { id: params.id } });
  if (!quote) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!isPrivileged(caller) && quote.normalizedEmail !== caller.email?.toLowerCase()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(isPrivileged(caller) ? quote : publicQuote(quote));
}

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const caller = await getCaller(req);
  if (!isAdmin(caller)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json().catch(() => ({}));
  const expectedVersion = Number(body.expectedVersion);
  if (!Number.isInteger(expectedVersion) || expectedVersion < 0) {
    return NextResponse.json({ error: "expectedVersion is required." }, { status: 428 });
  }
  try {
    if (body.ownerId) {
      return NextResponse.json(await assignQuote(params.id, String(body.ownerId), caller.id!, expectedVersion));
    }
    if (body.approvalDecision === "approve") {
      return NextResponse.json(await approveQuote(params.id, caller.id!, expectedVersion));
    }
    if (body.status) {
      return NextResponse.json(await transitionQuote(params.id, String(body.status), caller.id!, expectedVersion, cleanText(body.reason, 500)));
    }
    const current = await prisma.quoteRequest.findUnique({ where: { id: params.id } });
    if (!current) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (current.version !== expectedVersion) return NextResponse.json({ error: "Lead changed; refresh and try again." }, { status: 409 });
    const data: Record<string, unknown> = { version: { increment: 1 } };
    for (const [key, max] of [["projectType", 120], ["material", 120], ["zip", 24], ["message", 4000], ["adminNotes", 4000]] as const) {
      if (body[key] !== undefined) data[key] = cleanText(body[key], max);
    }
    const updated = await prisma.quoteRequest.update({ where: { id: params.id, version: expectedVersion }, data });
    await prisma.auditEvent.create({ data: { actorId: caller.id, action: "quote.updated", entityType: "QuoteRequest", entityId: params.id } });
    return NextResponse.json(updated);
  } catch (error) {
    const status = error instanceof PolicyError ? error.status : 500;
    return NextResponse.json({ error: status === 500 ? "Unable to update lead." : (error as Error).message }, { status });
  }
}

export async function DELETE(req: NextRequest) {
  const caller = await getCaller(req);
  if (!isAdmin(caller)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return NextResponse.json({ error: "Lead deletion is disabled; close it as lost to retain consent and audit history." }, { status: 405 });
}
