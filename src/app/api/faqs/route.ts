import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCaller, isPrivileged } from "@/lib/api-guard";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search");
  return NextResponse.json(
    await prisma.faq.findMany({
      where: search
        ? {
            OR: [
              { question: { contains: search, mode: "insensitive" } },
              { answer: { contains: search, mode: "insensitive" } },
            ],
          }
        : {},
      orderBy: { order: "asc" },
    })
  );
}

export async function POST(req: NextRequest) {
  if (!isPrivileged(await getCaller(req)))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const b = await req.json().catch(() => ({}));
  if (!b?.question || !b?.answer)
    return NextResponse.json({ error: "question and answer are required." }, { status: 422 });
  const f = await prisma.faq.create({
    data: { question: b.question, answer: b.answer, order: Number(b.order) || 0 },
  });
  return NextResponse.json(f, { status: 201 });
}
