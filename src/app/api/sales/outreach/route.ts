import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCaller, isAdmin } from "@/lib/api-guard";
import { createOutreachDraft } from "@/lib/sales-workflow";
import { PolicyError } from "@/lib/sales-policy";

export async function GET(req: NextRequest) {
  if (!isAdmin(await getCaller(req))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return NextResponse.json(await prisma.outreachMessage.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    select: { id: true, quoteId: true, channel: true, subject: true, body: true, status: true, createdById: true, reviewedById: true, reviewedAt: true, rejectionReason: true, lastError: true, createdAt: true },
  }));
}

export async function POST(req: NextRequest) {
  const caller = await getCaller(req);
  if (!isAdmin(caller)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json().catch(() => ({}));
  try {
    const draft = await createOutreachDraft({
      quoteId: body.quoteId ? String(body.quoteId) : undefined,
      contactId: String(body.contactId || ""),
      channel: body.channel,
      subject: body.subject,
      body: String(body.body || ""),
      createdById: caller.id!,
    });
    return NextResponse.json(draft, { status: 201 });
  } catch (error) {
    const status = error instanceof PolicyError ? error.status : 500;
    return NextResponse.json({ error: status === 500 ? "Unable to create outreach." : (error as Error).message }, { status });
  }
}

