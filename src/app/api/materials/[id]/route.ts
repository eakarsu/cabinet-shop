import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCaller, isPrivileged } from "@/lib/api-guard";

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  if (!isPrivileged(await getCaller(req)))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const b = await req.json().catch(() => ({}));
  const data: Record<string, unknown> = {};
  for (const k of ["slug", "name", "category", "kind", "blurb", "origin", "priceTier", "swatch", "imageUrl"])
    if (b[k] !== undefined) data[k] = b[k];
  for (const k of ["slabWidth", "slabHeight", "slabCost"])
    if (b[k] !== undefined) data[k] = b[k] === "" || b[k] == null ? null : Number(b[k]);
  if (b.features !== undefined)
    data.features = Array.isArray(b.features)
      ? b.features
      : String(b.features).split(",").map((s: string) => s.trim()).filter(Boolean);
  if (b.featured !== undefined) data.featured = Boolean(b.featured);
  if (b.order !== undefined) data.order = Number(b.order) || 0;
  try {
    return NextResponse.json(await prisma.material.update({ where: { id: params.id }, data }));
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  if (!isPrivileged(await getCaller(req)))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    await prisma.material.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
