import { NextResponse } from "next/server";
import { getBriefing } from "@/services/briefing/kv";

export async function GET(
  _request: Request,
  context: { params: Promise<{ date: string }> }
) {
  const { date } = await context.params;
  const briefing = await getBriefing(date);
  if (!briefing) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return NextResponse.json(briefing);
}
