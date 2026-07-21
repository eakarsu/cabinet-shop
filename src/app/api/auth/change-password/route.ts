import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email)
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const b = await req.json().catch(() => ({}));
  const current = String(b?.currentPassword ?? "");
  const next = String(b?.newPassword ?? "");
  if (next.length < 12 || next.length > 72)
    return NextResponse.json({ error: "New password must be 12-72 characters." }, { status: 422 });

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "User not found." }, { status: 404 });
  if (!(await bcrypt.compare(current, user.password)))
    return NextResponse.json({ error: "Current password is incorrect." }, { status: 403 });

  await prisma.user.update({
    where: { id: user.id },
    data: { password: await bcrypt.hash(next, 10) },
  });
  return NextResponse.json({ ok: true });
}
