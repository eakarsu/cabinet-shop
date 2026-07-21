import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifySignature } from "@/lib/sales-policy";

export async function POST(req: NextRequest, context: { params: Promise<{ provider: string }> }) {
  const params = await context.params;
  const endpoint = await prisma.integrationEndpoint.findFirst({
    where: { provider: params.provider, enabled: true, direction: { in: ["inbound", "bidirectional"] } },
  });
  if (!endpoint?.secretEnvKey) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const secret = process.env[endpoint.secretEnvKey];
  if (!secret) return NextResponse.json({ error: "Connector unavailable" }, { status: 503 });
  const timestamp = req.headers.get("x-heritage-timestamp");
  const timestampMs = Number(timestamp) * 1000;
  if (!timestamp || !Number.isFinite(timestampMs) || Math.abs(Date.now() - timestampMs) > 5 * 60 * 1000) {
    return NextResponse.json({ error: "Expired webhook" }, { status: 401 });
  }
  const raw = await req.text();
  if (Buffer.byteLength(raw) > 1_000_000) return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  if (!verifySignature(`${timestamp}.${raw}`, req.headers.get("x-heritage-signature"), secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }
  let body: Record<string, unknown>;
  try {
    body = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const eventType = String(body.eventType || "");
  const externalId = String(body.externalId || "");
  if (!eventType || !externalId || typeof body.payload !== "object" || !body.payload) {
    return NextResponse.json({ error: "eventType, externalId, and payload are required" }, { status: 422 });
  }
  const idempotencyKey = `${endpoint.id}:inbound:${externalId}:${eventType}`;
  const event = await prisma.integrationEvent.upsert({
    where: { idempotencyKey },
    create: { endpointId: endpoint.id, direction: "inbound", eventType, entityType: String(body.entityType || "Contact"), externalId, idempotencyKey, payload: body.payload as PrismaJsonObject },
    update: {},
  });
  return NextResponse.json({ accepted: true, eventId: event.id }, { status: event.status === "pending" ? 202 : 200 });
}

type PrismaJsonObject = { [key: string]: string | number | boolean | null | PrismaJsonObject | PrismaJsonObject[] };
