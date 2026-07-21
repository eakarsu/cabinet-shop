import { NextRequest, NextResponse } from "next/server";
import { getCaller, isAdmin } from "@/lib/api-guard";
import { conversionMetrics } from "@/lib/sales-workflow";

export async function GET(req: NextRequest) {
  if (!isAdmin(await getCaller(req))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return NextResponse.json(await conversionMetrics());
}

