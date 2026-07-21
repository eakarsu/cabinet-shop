import { NextRequest, NextResponse } from "next/server";
import { getCaller, isAdmin } from "@/lib/api-guard";
import { PolicyError } from "@/lib/sales-policy";
import { reviewOutreach } from "@/lib/sales-workflow";

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const caller = await getCaller(req);
  if (!isAdmin(caller)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json().catch(() => ({}));
  if (!["approve", "reject"].includes(body.decision)) return NextResponse.json({ error: "Decision must be approve or reject." }, { status: 422 });
  try {
    return NextResponse.json(await reviewOutreach(params.id, caller.id!, body.decision, body.reason));
  } catch (error) {
    const status = error instanceof PolicyError ? error.status : 500;
    return NextResponse.json({ error: status === 500 ? "Unable to review outreach." : (error as Error).message }, { status });
  }
}

