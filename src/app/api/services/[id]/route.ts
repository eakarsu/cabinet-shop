import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCaller, isPrivileged } from "@/lib/api-guard";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  if (!isPrivileged(await getCaller(req)))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const b = await req.json().catch(() => ({}));
  const data: Record<string, unknown> = {};
  for (const k of ["slug", "title", "description", "icon"])
    if (b[k] !== undefined) data[k] = b[k];
  if (b.order !== undefined) data.order = Number(b.order) || 0;
  try {
    return NextResponse.json(await prisma.service.update({ where: { id: params.id }, data }));
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  if (!isPrivileged(await getCaller(req)))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    await prisma.service.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
