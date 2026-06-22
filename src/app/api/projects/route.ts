import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCaller, isPrivileged } from "@/lib/api-guard";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tag = searchParams.get("tag");
  const projects = await prisma.project.findMany({
    where: tag && tag !== "All" ? { tag: { equals: tag, mode: "insensitive" } } : {},
    orderBy: [{ featured: "desc" }, { order: "asc" }],
  });
  return NextResponse.json(projects);
}

export async function POST(req: NextRequest) {
  if (!isPrivileged(await getCaller(req)))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const b = await req.json().catch(() => ({}));
  if (!b?.title || !b?.tag)
    return NextResponse.json({ error: "title and tag are required." }, { status: 422 });
  const project = await prisma.project.create({
    data: {
      title: b.title,
      tag: b.tag,
      location: b.location ?? null,
      description: b.description ?? null,
      grad: b.grad ?? "from-stone-700 to-stone-900",
      imageUrl: b.imageUrl ?? null,
      year: b.year != null ? Number(b.year) : null,
      featured: Boolean(b.featured),
      order: Number(b.order) || 0,
    },
  });
  return NextResponse.json(project, { status: 201 });
}
