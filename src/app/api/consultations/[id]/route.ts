import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCaller, isPrivileged } from "@/lib/api-guard";

async function canModify(req: NextRequest, id: string) {
  const caller = await getCaller(req);
  if (isPrivileged(caller)) return true;
  if (!caller.email) return false;
  const c = await prisma.consultation.findUnique({ where: { id } });
  return !!c && c.email === caller.email; // customers may modify only their own
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const consultation = await prisma.consultation.findUnique({ where: { id: params.id } });
  if (!consultation)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(consultation);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await canModify(req, params.id)))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json().catch(() => ({}));
  const data: Record<string, unknown> = {};
  for (const key of ["status", "time", "projectType", "material", "address", "notes"])
    if (body[key] !== undefined) data[key] = body[key];
  if (body.date !== undefined) data.date = new Date(body.date);
  try {
    return NextResponse.json(
      await prisma.consultation.update({ where: { id: params.id }, data })
    );
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await canModify(req, params.id)))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    await prisma.consultation.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
