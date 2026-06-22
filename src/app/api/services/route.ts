import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCaller, isPrivileged } from "@/lib/api-guard";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    await prisma.service.findMany({ orderBy: { order: "asc" } })
  );
}

export async function POST(req: NextRequest) {
  if (!isPrivileged(await getCaller(req)))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const b = await req.json().catch(() => ({}));
  if (!b?.title) return NextResponse.json({ error: "title is required." }, { status: 422 });
  const service = await prisma.service.create({
    data: {
      slug: b.slug || String(b.title).toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      title: b.title,
      description: b.description ?? "",
      icon: b.icon ?? "Sparkles",
      order: Number(b.order) || 0,
    },
  });
  return NextResponse.json(service, { status: 201 });
}
