import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { notifyTeam } from "@/lib/notify";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const quotes = await prisma.quoteRequest.findMany({
    where: status ? { status } : {},
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return NextResponse.json(quotes);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const name = String(body?.name ?? "").trim();
  const email = String(body?.email ?? "").trim();
  const phone = String(body?.phone ?? "").trim();
  if (!name || !email || !phone) {
    return NextResponse.json(
      { error: "Name, email, and phone are required." },
      { status: 422 }
    );
  }
  const quote = await prisma.quoteRequest.create({
    data: {
      name,
      email,
      phone,
      projectType: body.projectType ?? null,
      material: body.material ?? null,
      zip: body.zip ?? null,
      message: body.message ?? null,
      source: body.source === "ai_assistant" ? "ai_assistant" : "website",
    },
  });
  await notifyTeam(`New estimate request — ${quote.name}`, [
    `Name: ${quote.name}`,
    `Email: ${quote.email}`,
    `Phone: ${quote.phone}`,
    `Project: ${quote.projectType ?? "—"}`,
    `Material: ${quote.material ?? "—"}`,
    `Zip: ${quote.zip ?? "—"}`,
    `Source: ${quote.source}`,
    `Message: ${quote.message ?? "(none)"}`,
  ]);
  return NextResponse.json(quote, { status: 201 });
}
