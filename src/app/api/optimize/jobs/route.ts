import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCaller, isPrivileged } from "@/lib/api-guard";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!isPrivileged(await getCaller(req)))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const jobs = await prisma.optimizationJob.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return NextResponse.json(jobs);
}

export async function POST(req: NextRequest) {
  if (!isPrivileged(await getCaller(req)))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const b = await req.json().catch(() => ({}));
  if (!b?.input || !b?.result)
    return NextResponse.json({ error: "input and result are required." }, { status: 422 });
  const job = await prisma.optimizationJob.create({
    data: {
      name: b.name ?? null,
      materialId: b.materialId ?? null,
      engine: b.engine ?? "maxrects",
      input: b.input,
      result: b.result,
      slabsUsed: Number(b.slabsUsed) || 0,
      yieldPct: Number(b.yieldPct) || 0,
      cost: b.cost != null ? Number(b.cost) : null,
    },
  });
  return NextResponse.json(job, { status: 201 });
}
