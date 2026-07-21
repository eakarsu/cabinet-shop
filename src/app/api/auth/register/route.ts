import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { consumeRateLimit, requestSubject } from "@/lib/rate-limit";
import { normalizeEmail } from "@/lib/sales-policy";

export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => ({}));
  const name = String(b?.name ?? "").trim();
  let email: string;
  try {
    email = normalizeEmail(b?.email);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid email." }, { status: 422 });
  }
  const password = String(b?.password ?? "");

  const budget = await consumeRateLimit("register", requestSubject(req), 5, 60 * 60 * 1000);
  if (!budget.allowed)
    return NextResponse.json({ error: "Too many registration attempts." }, { status: 429 });

  if (!email || !password)
    return NextResponse.json({ error: "Email and password are required." }, { status: 422 });
  if (password.length < 12 || password.length > 72)
    return NextResponse.json({ error: "Password must be 12-72 characters." }, { status: 422 });

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing)
    return NextResponse.json({ error: "Unable to create account with those details." }, { status: 409 });

  const user = await prisma.user.create({
    data: { name: name || null, email, password: await bcrypt.hash(password, 10), role: "customer" },
  });
  return NextResponse.json({ ok: true, id: user.id });
}
