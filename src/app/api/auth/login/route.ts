import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { issueRuntimeToken } from "@/lib/runtime-auth";
import { consumeRateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  if (!(await consumeRateLimit("runtime-login", email || "missing", 10, 15 * 60 * 1000)).allowed) return NextResponse.json({ error: "Too many login attempts." }, { status: 429 });
  const user = email ? await prisma.user.findUnique({ where: { email } }) : null;
  if (!user?.active || !password || !(await bcrypt.compare(password, user.password))) return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  const token = issueRuntimeToken(user);
  return NextResponse.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
}
