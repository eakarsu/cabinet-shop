import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCaller, isPrivileged } from "@/lib/api-guard";

export const dynamic = "force-dynamic";

const DEFAULTS = {
  id: "default",
  companyName: "Heritage Cabinet & Stone",
  phone: "(555) 482-7100",
  email: "hello@heritagecabinetstone.com",
  address: "1840 Millwright Ave, Suite 5, Riverton",
  hours: ["Mon–Fri · 8am–6pm", "Saturday · 9am–2pm", "Sunday · Closed"],
};

export async function GET() {
  const s = await prisma.setting.findUnique({ where: { id: "default" } });
  return NextResponse.json(s ?? DEFAULTS);
}

export async function PUT(req: NextRequest) {
  if (!isPrivileged(await getCaller(req)))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const b = await req.json().catch(() => ({}));
  const data: Record<string, unknown> = {};
  for (const k of ["companyName", "phone", "email", "address"])
    if (b[k] !== undefined) data[k] = b[k];
  if (b.hours !== undefined)
    data.hours = Array.isArray(b.hours)
      ? b.hours
      : String(b.hours).split("\n").map((s: string) => s.trim()).filter(Boolean);
  const s = await prisma.setting.upsert({
    where: { id: "default" },
    update: data,
    create: { ...DEFAULTS, ...data },
  });
  return NextResponse.json(s);
}
