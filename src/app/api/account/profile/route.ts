import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email)
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const b = await req.json().catch(() => ({}));
  const name = String(b?.name ?? "").trim();
  if (!name) return NextResponse.json({ error: "Name is required." }, { status: 422 });

  const user = await prisma.user.update({
    where: { email: session.user.email },
    data: { name },
  });
  return NextResponse.json({ ok: true, name: user.name });
}
