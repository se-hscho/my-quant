import { NextResponse } from "next/server";
import type { HoldingsSnapshot } from "@/types/agent";
import { generateBriefing } from "@/services/briefing/generate";
import { getBriefing, listBriefingDates, saveBriefing } from "@/services/briefing/kv";

export async function GET() {
  const dates = await listBriefingDates();
  const today = new Date().toISOString().slice(0, 10);
  const todayBriefing = await getBriefing(today);
  return NextResponse.json({ dates, today, briefing: todayBriefing });
}

export async function POST(request: Request) {
  let snapshot: HoldingsSnapshot;
  try {
    const body = (await request.json()) as { snapshot?: HoldingsSnapshot };
    if (!body.snapshot?.holdings || !body.snapshot?.cash) {
      return NextResponse.json({ error: "snapshot required" }, { status: 400 });
    }
    snapshot = body.snapshot;
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  try {
    const briefing = await generateBriefing({ snapshot });
    const saved = await saveBriefing(briefing);
    if (!saved) {
      return NextResponse.json(
        { error: "storage unavailable", code: "KV_UNAVAILABLE" },
        { status: 503 }
      );
    }
    return NextResponse.json(briefing);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "generation failed";
    return NextResponse.json({ error: msg }, { status: 503 });
  }
}
