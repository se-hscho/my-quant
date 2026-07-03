import { NextResponse } from "next/server";
import type { HoldingsSnapshot } from "@/types/agent";
import type { BriefingErrorInfo } from "@/types/agent-briefing";
import { mapGenerationErrorMessage } from "@/types/agent-briefing";
import { briefingErrorResponse } from "@/lib/agent/briefing-api-errors";
import { DEMO_PORTFOLIO_SNAPSHOT } from "@/lib/agent/demo-portfolio";
import { generateBriefing } from "@/services/briefing/generate";
import { getBriefing, listBriefingDates, saveBriefing } from "@/services/briefing/kv";

async function generateDemoBriefing(date?: string) {
  return generateBriefing({
    snapshot: DEMO_PORTFOLIO_SNAPSHOT,
    date,
    allowDemoFallback: true,
  });
}

export async function GET(request: Request) {
  const demo = new URL(request.url).searchParams.get("demo") === "1";
  const dates = await listBriefingDates();
  const today = new Date().toISOString().slice(0, 10);
  let todayBriefing = await getBriefing(today);
  let error: BriefingErrorInfo | null = null;

  if (demo && (!todayBriefing || todayBriefing.status !== "complete")) {
    try {
      todayBriefing = await generateDemoBriefing(today);
      todayBriefing.disclaimer = `${todayBriefing.disclaimer} (예시 포트폴리오 미리보기)`;
      await saveBriefing(todayBriefing);
    } catch (e) {
      todayBriefing = null;
      const msg = e instanceof Error ? e.message : "demo generation failed";
      error = {
        code: "DEMO_FALLBACK_FAILED",
        message: "데모 브리핑 생성 실패",
        detail: msg,
      };
    }
  }

  return NextResponse.json({ dates, today, briefing: todayBriefing, demo, error });
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
      return briefingErrorResponse(
        {
          code: "INVALID_REQUEST",
          message: "snapshot required",
          detail: "holdings·cash 필드 필요",
        },
        400
      );
    }
    snapshot = body.snapshot;
    demo = body.demo === true;
  } catch (e) {
    return briefingErrorResponse(
      {
        code: "INVALID_REQUEST",
        message: "invalid body",
        detail: e instanceof Error ? e.message : undefined,
      },
      400
    );
  }

  try {
    const briefing = await generateBriefing({
      snapshot,
      allowDemoFallback: demo,
    });
    if (demo) {
      briefing.disclaimer = `${briefing.disclaimer} (예시 포트폴리오 미리보기)`;
    }
    await saveBriefing(briefing);
    return NextResponse.json(briefing);
  } catch (e) {
    if (demo) {
      try {
        const fallback = await generateDemoBriefing();
        fallback.disclaimer = `${fallback.disclaimer} (예시 포트폴리오 미리보기)`;
        await saveBriefing(fallback);
        return NextResponse.json(fallback);
      } catch (fallbackErr) {
        const detail = [
          e instanceof Error ? e.message : String(e),
          fallbackErr instanceof Error ? fallbackErr.message : String(fallbackErr),
        ].join(" | ");
        return briefingErrorResponse(
          {
            code: "DEMO_FALLBACK_FAILED",
            message: "데모 브리핑 생성·폴백 모두 실패",
            detail,
          },
          503
        );
      }
    }
    const msg = e instanceof Error ? e.message : "generation failed";
    return briefingErrorResponse(mapGenerationErrorMessage(msg), 503);
  }
}
