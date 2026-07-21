import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCaller, isAdmin } from "@/lib/api-guard";
import { assertAccountTransition, cleanText, PolicyError } from "@/lib/sales-policy";

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const caller = await getCaller(req);
  if (!isAdmin(caller)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await context.params;
  const body = await req.json().catch(() => ({}));
  const expectedVersion = Number(body.expectedVersion);
  try {
    const account = await prisma.account.findUnique({ where: { id } });
    if (!account) throw new PolicyError("Account not found.", 404);
    if (!Number.isInteger(expectedVersion) || expectedVersion !== account.version) throw new PolicyError("Account changed; refresh and try again.", 409);
    const data: Record<string, unknown> = { version: { increment: 1 } };
    if (body.status !== undefined) {
      const target = String(body.status);
      assertAccountTransition(account.status, target, body.ownerId || account.ownerId);
      data.status = target;
    }
    if (body.ownerId !== undefined) {
      const ownerId = body.ownerId ? String(body.ownerId) : null;
      if (ownerId && !await prisma.user.findFirst({ where: { id: ownerId, role: "admin", active: true } })) throw new PolicyError("Owner must be active staff.");
      data.ownerId = ownerId;
    }
    if (body.name !== undefined) {
      const name = cleanText(body.name, 160);
      if (!name) throw new PolicyError("Account name is required.");
      data.name = name;
    }
    const updated = await prisma.account.update({ where: { id, version: expectedVersion }, data });
    await prisma.auditEvent.create({ data: { actorId: caller.id, action: "account.updated", entityType: "Account", entityId: id, metadata: { status: updated.status, ownerId: updated.ownerId } } });
    const endpoints = await prisma.integrationEndpoint.findMany({ where: { enabled: true, category: "crm", direction: { in: ["outbound", "bidirectional"] } } });
    await prisma.integrationEvent.createMany({ data: endpoints.map((endpoint) => ({ endpointId: endpoint.id, direction: "outbound", eventType: "account.updated", entityType: "Account", entityId: id, idempotencyKey: `${endpoint.id}:account.updated:${id}:v${updated.version}`, payload: { accountId: id, status: updated.status, ownerId: updated.ownerId } })), skipDuplicates: true });
    return NextResponse.json(updated);
  } catch (error) {
    const status = error instanceof PolicyError ? error.status : 500;
    return NextResponse.json({ error: status === 500 ? "Unable to update account." : (error as Error).message }, { status });
  }
}

export async function DELETE(req: NextRequest) {
  if (!isAdmin(await getCaller(req))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return NextResponse.json({ error: "Account deletion is disabled; transition it to dormant." }, { status: 405 });
}
