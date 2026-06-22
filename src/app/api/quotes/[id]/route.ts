import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCaller, isPrivileged } from "@/lib/api-guard";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const quote = await prisma.quoteRequest.findUnique({ where: { id: params.id } });
  if (!quote) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(quote);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!isPrivileged(await getCaller(req)))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json().catch(() => ({}));
  const data: Record<string, unknown> = {};
  for (const key of ["status", "projectType", "material", "zip", "message", "adminNotes"]) {
    if (body[key] !== undefined) data[key] = body[key];
  }
  try {
    const updated = await prisma.quoteRequest.update({
      where: { id: params.id },
      data,
    });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!isPrivileged(await getCaller(req)))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    await prisma.quoteRequest.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
