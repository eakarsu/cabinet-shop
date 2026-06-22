import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { notifyTeam } from "@/lib/notify";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  const status = searchParams.get("status");
  const where: Record<string, unknown> = {};
  if (date) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    where.date = { gte: start, lte: end };
  }
  if (status) where.status = status;
  const consultations = await prisma.consultation.findMany({
    where,
    orderBy: [{ date: "asc" }, { time: "asc" }],
    take: 50,
  });
  return NextResponse.json(consultations);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const name = String(body?.name ?? "").trim();
  const phone = String(body?.phone ?? "").trim();
  if (!name || !phone || !body?.date || !body?.time) {
    return NextResponse.json(
      { error: "name, phone, date, and time are required." },
      { status: 422 }
    );
  }
  const consultation = await prisma.consultation.create({
    data: {
      name,
      email: body.email ?? null,
      phone,
      date: new Date(body.date),
      time: String(body.time),
      projectType: body.projectType ?? null,
      material: body.material ?? null,
      address: body.address ?? null,
      notes: body.notes ?? null,
      status: "requested",
      source: body.source === "ai_assistant" ? "ai_assistant" : "website",
    },
  });
  await notifyTeam(`New consultation — ${consultation.name}`, [
    `Name: ${consultation.name}`,
    `Phone: ${consultation.phone}`,
    `Email: ${consultation.email ?? "—"}`,
    `Date: ${new Date(consultation.date).toLocaleDateString()} at ${consultation.time}`,
    `Project: ${consultation.projectType ?? "—"}`,
    `Source: ${consultation.source}`,
  ]);
  return NextResponse.json(consultation, { status: 201 });
}
