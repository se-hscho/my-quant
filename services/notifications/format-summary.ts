import type { Briefing } from "@/services/briefing/types";
import { BRIEFING_DISCLAIMER } from "@/services/briefing/types";

export function formatMorningSummary(briefing: Briefing, reportUrl: string): {
  subject: string;
  text: string;
  html: string;
} {
  const lines = briefing.summaryLines.slice(0, 5);
  const scenarioBlock = briefing.scenarioComparison
    .map((s) => `안 ${s.id} ${s.label}: ${s.expectedReturn}% / σ ${s.expectedVolatility}%`)
    .join("\n");

  const text = [
    "포트폴리오 에이전트 — 오늘 요약",
    "",
    ...lines.map((l, i) => `${i + 1}. ${l}`),
    "",
    "[시나리오 비교]",
    scenarioBlock,
    "",
    `상세: ${reportUrl}`,
    "",
    BRIEFING_DISCLAIMER,
  ].join("\n");

  return {
    subject: `[포트폴리오] ${briefing.date} 아침 브리핑`,
    text,
    html: `<p>${lines.join("</p><p>")}</p><pre>${scenarioBlock}</pre><p><a href="${reportUrl}">상세 보기</a></p><p><small>${BRIEFING_DISCLAIMER}</small></p>`,
  };
}
