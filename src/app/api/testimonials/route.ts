import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCaller, isPrivileged } from "@/lib/api-guard";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    await prisma.testimonial.findMany({ orderBy: { order: "asc" } })
  );
}

export async function POST(req: NextRequest) {
  if (!isPrivileged(await getCaller(req)))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const b = await req.json().catch(() => ({}));
  if (!b?.quote || !b?.name)
    return NextResponse.json({ error: "quote and name are required." }, { status: 422 });
  const t = await prisma.testimonial.create({
    data: {
      quote: b.quote,
      name: b.name,
      detail: b.detail ?? null,
      rating: b.rating != null ? Number(b.rating) : 5,
      order: Number(b.order) || 0,
    },
  });
  return NextResponse.json(t, { status: 201 });
}
