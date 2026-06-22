import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCaller } from "@/lib/api-guard";

export const dynamic = "force-dynamic";

export async function GET() {
  const caller = await getCaller(new Request("http://x"));
  if (!caller.email) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const favs = await prisma.favorite.findMany({ where: { email: caller.email } });
  const ids = favs.map((f) => f.materialId);
  const materials = ids.length
    ? await prisma.material.findMany({ where: { id: { in: ids } } })
    : [];
  return NextResponse.json({ ids, materials });
}

export async function POST(req: NextRequest) {
  const caller = await getCaller(req);
  if (!caller.email) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  const materialId = String(b?.materialId ?? "");
  if (!materialId) return NextResponse.json({ error: "materialId required." }, { status: 422 });
  await prisma.favorite.upsert({
    where: { email_materialId: { email: caller.email, materialId } },
    update: {},
    create: { email: caller.email, materialId },
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const caller = await getCaller(req);
  if (!caller.email) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  const materialId = String(b?.materialId ?? "");
  await prisma.favorite.deleteMany({ where: { email: caller.email, materialId } });
  return NextResponse.json({ ok: true });
}
