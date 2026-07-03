import { NextResponse } from "next/server";
import type { HoldingsSnapshot } from "@/types/agent";
import { DEMO_PORTFOLIO_SNAPSHOT } from "@/lib/agent/demo-portfolio";
import { generateBriefing } from "@/services/briefing/generate";
import { getBriefing, listBriefingDates, saveBriefing } from "@/services/briefing/kv";

export async function GET(request: Request) {
  const demo = new URL(request.url).searchParams.get("demo") === "1";
  const dates = await listBriefingDates();
  const today = new Date().toISOString().slice(0, 10);
  let todayBriefing = await getBriefing(today);

  if (demo && (!todayBriefing || todayBriefing.status !== "complete")) {
    try {
      todayBriefing = await generateBriefing({
        snapshot: DEMO_PORTFOLIO_SNAPSHOT,
      });
      await saveBriefing(todayBriefing);
    } catch {
      todayBriefing = null;
    }
  }

  return NextResponse.json({ dates, today, briefing: todayBriefing, demo });
}

export async function POST(request: Request) {
  let snapshot: HoldingsSnapshot;
  let demo = false;
  try {
    const body = (await request.json()) as {
      snapshot?: HoldingsSnapshot;
      demo?: boolean;
    };
    if (!body.snapshot?.holdings || !body.snapshot?.cash) {
      return NextResponse.json({ error: "snapshot required" }, { status: 400 });
    }
    snapshot = body.snapshot;
    demo = body.demo === true;
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  try {
    const briefing = await generateBriefing({ snapshot });
    if (demo) {
      briefing.disclaimer = `${briefing.disclaimer} (예시 포트폴리오 미리보기)`;
    }
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
