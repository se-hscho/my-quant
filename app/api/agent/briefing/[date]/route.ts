import { NextResponse } from "next/server";
import { DEMO_PORTFOLIO_SNAPSHOT } from "@/lib/agent/demo-portfolio";
import { generateBriefing } from "@/services/briefing/generate";
import { getBriefing, saveBriefing } from "@/services/briefing/kv";

export async function GET(
  request: Request,
  context: { params: Promise<{ date: string }> }
) {
  const { date } = await context.params;
  const demo = new URL(request.url).searchParams.get("demo") === "1";

  let briefing = await getBriefing(date);
  if ((!briefing || briefing.status !== "complete") && demo) {
    try {
      briefing = await generateBriefing({
        snapshot: DEMO_PORTFOLIO_SNAPSHOT,
        date,
      });
      briefing.disclaimer = `${briefing.disclaimer} (예시 포트폴리오 미리보기)`;
      await saveBriefing(briefing);
    } catch {
      return NextResponse.json({ error: "demo generation failed" }, { status: 503 });
    }
  }

  if (!briefing) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return NextResponse.json(briefing);
}
