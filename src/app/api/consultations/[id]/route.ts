import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCaller, isAdmin, isPrivileged } from "@/lib/api-guard";
import { cleanText, PolicyError } from "@/lib/sales-policy";

const ADMIN_TRANSITIONS: Record<string, string[]> = {
  requested: ["confirmed", "cancelled"],
  confirmed: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

async function readable(req: NextRequest, id: string) {
  const caller = await getCaller(req);
  if (!caller.role) return { caller, consultation: null };
  const consultation = await prisma.consultation.findUnique({ where: { id } });
  if (!consultation || (!isPrivileged(caller) && consultation.email !== caller.email)) return { caller, consultation: null };
  return { caller, consultation };
}

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const { caller, consultation } = await readable(req, params.id);
  if (!caller.role) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!consultation) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(consultation);
}

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const { caller, consultation } = await readable(req, params.id);
  if (!caller.role) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!consultation) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const body = await req.json().catch(() => ({}));
  const expectedVersion = Number(body.expectedVersion);
  if (!Number.isInteger(expectedVersion) || expectedVersion !== consultation.version) {
    return NextResponse.json({ error: "Consultation changed; refresh and try again." }, { status: 409 });
  }
  try {
    const data: Record<string, unknown> = { version: { increment: 1 } };
    if (body.status !== undefined) {
      const target = String(body.status);
      if (!isAdmin(caller) && target !== "cancelled") throw new PolicyError("Customers may only cancel their booking.", 403);
      if (!ADMIN_TRANSITIONS[consultation.status]?.includes(target)) throw new PolicyError("Invalid consultation transition.", 409);
      data.status = target;
    }
    if (body.date !== undefined || body.time !== undefined) {
      if (!["requested", "confirmed"].includes(consultation.status)) throw new PolicyError("This booking can no longer be rescheduled.", 409);
      const dateText = String(body.date ?? consultation.date.toISOString().slice(0, 10));
      const time = String(body.time ?? consultation.time);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateText) || !/^(09:00|10:30|13:00|14:30|16:00)$/.test(time)) throw new PolicyError("Invalid date or time.");
      const date = new Date(`${dateText}T12:00:00.000Z`);
      const occupied = await prisma.consultation.findFirst({ where: { id: { not: params.id }, date, time, status: { not: "cancelled" } } });
      if (occupied) throw new PolicyError("That slot is no longer available.", 409);
      data.date = date;
      data.time = time;
      data.handoffState = "pending";
      data.calendarEventId = null;
    }
    if (isAdmin(caller)) {
      for (const [key, max] of [["projectType", 120], ["material", 120], ["address", 500], ["notes", 2000]] as const) {
        if (body[key] !== undefined) data[key] = cleanText(body[key], max);
      }
    }
    const updated = await prisma.consultation.update({ where: { id: params.id, version: expectedVersion }, data });
    await prisma.auditEvent.create({ data: { actorId: caller.id, action: "consultation.updated", entityType: "Consultation", entityId: params.id, metadata: { status: updated.status } } });
    const endpoints = await prisma.integrationEndpoint.findMany({ where: { enabled: true, category: { in: ["calendar", "crm"] }, direction: { in: ["outbound", "bidirectional"] } } });
    await prisma.integrationEvent.createMany({ data: endpoints.map((endpoint) => ({ endpointId: endpoint.id, direction: "outbound", eventType: "consultation.updated", entityType: "Consultation", entityId: params.id, idempotencyKey: `${endpoint.id}:consultation.updated:${params.id}:v${updated.version}`, payload: { consultationId: params.id, status: updated.status, date: updated.date.toISOString(), time: updated.time } })), skipDuplicates: true });
    return NextResponse.json(updated);
  } catch (error) {
    const status = error instanceof PolicyError ? error.status : 500;
    return NextResponse.json({ error: status === 500 ? "Unable to update consultation." : (error as Error).message }, { status });
  }
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const body = new Request(req.url, { method: "PUT", headers: req.headers, body: JSON.stringify({ status: "cancelled", expectedVersion: Number(req.headers.get("if-match")) }) });
  return PUT(body as NextRequest, context);
}
