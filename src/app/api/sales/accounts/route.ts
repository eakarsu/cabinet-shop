import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCaller, isAdmin } from "@/lib/api-guard";
import { cleanText, PolicyError } from "@/lib/sales-policy";

export async function GET(req: NextRequest) {
  if (!isAdmin(await getCaller(req))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return NextResponse.json(await prisma.account.findMany({ include: { owner: { select: { id: true, name: true, email: true } }, _count: { select: { contacts: true } } }, orderBy: { updatedAt: "desc" }, take: 100 }));
}

export async function POST(req: NextRequest) {
  const caller = await getCaller(req);
  if (!isAdmin(caller)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json().catch(() => ({}));
  try {
    const name = cleanText(body.name, 160);
    if (!name) throw new PolicyError("Account name is required.");
    const domain = cleanText(body.domain, 253)?.toLowerCase() || null;
    if (domain && !/^[a-z0-9.-]+\.[a-z]{2,}$/.test(domain)) throw new PolicyError("Account domain is invalid.");
    const ownerId = body.ownerId ? String(body.ownerId) : null;
    if (ownerId && !await prisma.user.findFirst({ where: { id: ownerId, role: "admin", active: true } })) throw new PolicyError("Owner must be active staff.");
    const account = await prisma.account.create({ data: { name, domain, ownerId } });
    const contactIds = Array.isArray(body.contactIds) ? body.contactIds.slice(0, 100).map(String) : [];
    if (contactIds.length) await prisma.contact.updateMany({ where: { id: { in: contactIds } }, data: { accountId: account.id } });
    await prisma.auditEvent.create({ data: { actorId: caller.id, action: "account.created", entityType: "Account", entityId: account.id, metadata: { ownerId } } });
    return NextResponse.json(account, { status: 201 });
  } catch (error) {
    const status = error instanceof PolicyError ? error.status : 500;
    return NextResponse.json({ error: status === 500 ? "Unable to create account." : (error as Error).message }, { status });
  }
}

