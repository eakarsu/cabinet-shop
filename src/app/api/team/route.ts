import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCaller, isPrivileged } from "@/lib/api-guard";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    await prisma.teamMember.findMany({ orderBy: { order: "asc" } })
  );
}

export async function POST(req: NextRequest) {
  if (!isPrivileged(await getCaller(req)))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const b = await req.json().catch(() => ({}));
  if (!b?.name || !b?.role)
    return NextResponse.json({ error: "name and role are required." }, { status: 422 });
  const m = await prisma.teamMember.create({
    data: {
      name: b.name,
      role: b.role,
      bio: b.bio ?? null,
      initials:
        b.initials ||
        String(b.name)
          .split(" ")
          .map((s: string) => s[0])
          .join("")
          .slice(0, 2)
          .toUpperCase(),
      order: Number(b.order) || 0,
    },
  });
  return NextResponse.json(m, { status: 201 });
}
