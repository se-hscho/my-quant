import { NextResponse } from "next/server";
import { briefingErrorResponse, fromThrownError } from "@/lib/agent/briefing-api-errors";
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
        allowDemoFallback: true,
      });
      briefing.disclaimer = `${briefing.disclaimer} (예시 포트폴리오 미리보기)`;
      await saveBriefing(briefing);
    } catch (e) {
      return fromThrownError(e, 503);
    }
  }

  if (!briefing) {
    return briefingErrorResponse(
      {
        code: "BRIEFING_NOT_FOUND",
        message: "브리핑을 찾을 수 없습니다",
        detail: `date=${date}, demo=${demo}`,
      },
      404
    );
  }

  if (briefing.status !== "complete") {
    return briefingErrorResponse(
      {
        code: "BRIEFING_INCOMPLETE",
        message: "불완전한 브리핑",
        detail: `date=${date}, status=${briefing.status}`,
      },
      503
    );
  }

  return NextResponse.json(briefing);
}
