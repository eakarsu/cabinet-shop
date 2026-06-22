import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCaller, isPrivileged } from "@/lib/api-guard";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const materialId = searchParams.get("materialId");
  const includeUsed = searchParams.get("all") === "1";
  const remnants = await prisma.remnant.findMany({
    where: {
      ...(materialId ? { materialId } : {}),
      ...(includeUsed ? {} : { used: false }),
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(remnants);
}

export async function POST(req: NextRequest) {
  if (!isPrivileged(await getCaller(req)))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const b = await req.json().catch(() => ({}));
  const rows = Array.isArray(b?.remnants) ? b.remnants : [b];
  const data = rows
    .filter((r: any) => r && r.w > 0 && r.h > 0)
    .map((r: any) => ({
      materialId: r.materialId ?? null,
      label: r.label ?? null,
      w: Number(r.w),
      h: Number(r.h),
    }));
  if (data.length === 0)
    return NextResponse.json({ error: "No valid remnants." }, { status: 422 });
  await prisma.remnant.createMany({ data });
  return NextResponse.json({ ok: true, created: data.length }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  if (!isPrivileged(await getCaller(req)))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const b = await req.json().catch(() => ({}));
  const ids: string[] = Array.isArray(b?.ids) ? b.ids : [];
  if (ids.length === 0) return NextResponse.json({ ok: true, updated: 0 });
  const used = b?.used === false ? false : true;
  const res = await prisma.remnant.updateMany({ where: { id: { in: ids } }, data: { used } });
  return NextResponse.json({ ok: true, updated: res.count });
}

export async function DELETE(req: NextRequest) {
  if (!isPrivileged(await getCaller(req)))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 422 });
  await prisma.remnant.delete({ where: { id } }).catch(() => {});
  return NextResponse.json({ ok: true });
}
