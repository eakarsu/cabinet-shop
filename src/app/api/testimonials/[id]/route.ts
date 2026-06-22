import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCaller, isPrivileged } from "@/lib/api-guard";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  if (!isPrivileged(await getCaller(req)))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const b = await req.json().catch(() => ({}));
  const data: Record<string, unknown> = {};
  for (const k of ["quote", "name", "detail"]) if (b[k] !== undefined) data[k] = b[k];
  if (b.rating !== undefined) data.rating = Number(b.rating) || 5;
  if (b.order !== undefined) data.order = Number(b.order) || 0;
  try {
    return NextResponse.json(await prisma.testimonial.update({ where: { id: params.id }, data }));
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  if (!isPrivileged(await getCaller(req)))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    await prisma.testimonial.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
