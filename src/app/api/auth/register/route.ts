import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => ({}));
  const name = String(b?.name ?? "").trim();
  const email = String(b?.email ?? "").trim().toLowerCase();
  const password = String(b?.password ?? "");

  if (!email || !password)
    return NextResponse.json({ error: "Email and password are required." }, { status: 422 });
  if (password.length < 6)
    return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 422 });

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing)
    return NextResponse.json({ error: "An account with that email already exists." }, { status: 409 });

  const user = await prisma.user.create({
    data: { name: name || null, email, password: await bcrypt.hash(password, 10), role: "customer" },
  });
  return NextResponse.json({ ok: true, id: user.id });
}
