import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCaller, isPrivileged } from "@/lib/api-guard";
import { consumeRateLimit, requestSubject } from "@/lib/rate-limit";
import { createConsultation } from "@/lib/sales-workflow";
import { PolicyError } from "@/lib/sales-policy";
import { notifyTeam } from "@/lib/notify";

function dateRange(date: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  return {
    gte: new Date(`${date}T00:00:00.000Z`),
    lte: new Date(`${date}T23:59:59.999Z`),
  };
}

export async function GET(req: NextRequest) {
  const query = new URL(req.url).searchParams;
  const caller = await getCaller(req);
  const range = query.get("date") ? dateRange(query.get("date")!) : null;
  if (!caller.role) {
    if (!range || query.get("availability") !== "1") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const bookings = await prisma.consultation.findMany({ where: { date: range, status: { not: "cancelled" } }, select: { time: true } });
    return NextResponse.json({ bookedTimes: bookings.map((row) => row.time) });
  }
  const consultations = await prisma.consultation.findMany({
    where: {
      ...(range ? { date: range } : {}),
      ...(query.get("status") ? { status: query.get("status")! } : {}),
      ...(!isPrivileged(caller) ? { email: caller.email } : {}),
    },
    orderBy: [{ date: "asc" }, { time: "asc" }],
    take: 100,
  });
  return NextResponse.json(consultations);
}

export async function POST(req: NextRequest) {
  const budget = await consumeRateLimit("consultation", requestSubject(req), 10, 60 * 60 * 1000);
  if (!budget.allowed) return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
  const body = await req.json().catch(() => null);
  if (body?.website) return NextResponse.json({ ok: true }, { status: 202 });
  try {
    const result = await createConsultation({ ...body, idempotencyKey: req.headers.get("idempotency-key") });
    if (result.created) {
      await notifyTeam(`New consultation — ${result.consultation.name}`, [
        `Consultation ID: ${result.consultation.id}`,
        `Date: ${result.consultation.date.toISOString().slice(0, 10)} at ${result.consultation.time}`,
        `Project: ${result.consultation.projectType ?? "—"}`,
        `Source: ${result.consultation.source}`,
      ]);
    }
    return NextResponse.json({
      id: result.consultation.id,
      status: result.consultation.status,
      date: result.consultation.date,
      time: result.consultation.time,
      createdAt: result.consultation.createdAt,
    }, { status: result.created ? 201 : 200 });
  } catch (error) {
    const status = error instanceof PolicyError ? error.status : 500;
    return NextResponse.json({ error: status === 500 ? "Unable to book consultation." : (error as Error).message }, { status });
  }
}
