import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCaller, isPrivileged } from "@/lib/api-guard";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const search = searchParams.get("search");
  const materials = await prisma.material.findMany({
    where: {
      ...(category
        ? { category: { equals: category, mode: "insensitive" } }
        : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { blurb: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: [{ featured: "desc" }, { order: "asc" }],
  });
  return NextResponse.json(materials);
}

export async function POST(req: NextRequest) {
  if (!isPrivileged(await getCaller(req)))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json().catch(() => null);
  if (!body?.name || !body?.category) {
    return NextResponse.json(
      { error: "name and category are required." },
      { status: 422 }
    );
  }
  const material = await prisma.material.create({
    data: {
      slug:
        body.slug ||
        String(body.name).toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      name: body.name,
      category: body.category,
      kind: body.kind ?? "Natural Stone",
      blurb: body.blurb ?? "",
      origin: body.origin ?? null,
      priceTier: body.priceTier ?? "$$",
      features: Array.isArray(body.features) ? body.features : [],
      swatch: body.swatch ?? "from-stone-700 to-stone-900",
      imageUrl: body.imageUrl ?? null,
      slabWidth: body.slabWidth != null && body.slabWidth !== "" ? Number(body.slabWidth) : null,
      slabHeight: body.slabHeight != null && body.slabHeight !== "" ? Number(body.slabHeight) : null,
      slabCost: body.slabCost != null && body.slabCost !== "" ? Number(body.slabCost) : null,
      featured: Boolean(body.featured),
      order: Number(body.order) || 0,
    },
  });
  return NextResponse.json(material, { status: 201 });
}
