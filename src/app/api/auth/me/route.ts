import { NextRequest, NextResponse } from "next/server";
import { requireRuntimeUser } from "@/lib/runtime-auth";

export async function GET(request: NextRequest) {
  try { return NextResponse.json({ user: await requireRuntimeUser(request) }); }
  catch { return NextResponse.json({ error: "Authentication required." }, { status: 401 }); }
}
