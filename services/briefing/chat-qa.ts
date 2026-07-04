import type { Briefing } from "./types";

export function answerBriefingQuestion(message: string, briefing: Briefing): string | null {
  const text = message.trim();
  if (!text) return null;

  const scenarioMatch = text.match(/안\s*([0-3])/);
  if (scenarioMatch || /follow|선점|최소|유지/i.test(text)) {
    const id = scenarioMatch
      ? (Number(scenarioMatch[1]) as 0 | 1 | 2 | 3)
      : /follow/i.test(text)
        ? 1
        : /선점/.test(text)
          ? 2
          : /최소/.test(text)
            ? 3
            : 0;
    const s = briefing.scenarios.find((sc) => sc.id === id);
    if (!s) return null;
    const steps = s.playbook
      .toSorted((a, b) => a.order - b.order)
      .map((p) => `${p.order}단계 ${p.action} ${p.note ?? ""}`)
      .join("\n");
    return `안 ${s.id} (${s.label}) — 예상 수익 ${s.expectedReturn}% · 변동성 ${s.expectedVolatility}% (참고용).\n\n${briefing.summaryLines[0]}\n\nPlaybook:\n${steps || "유지"}\n\n${briefing.disclaimer}`;
  }

  if (/추천|신규|분석.?가이드|분할/.test(text)) {
    const rec = briefing.sections.recommendations.rows[0];
    const layerSummary = briefing.sections.analysisGuide.layers
      .map((l) => `${l.layer} ${l.title}`)
      .join(" → ");
    if (rec) {
      return `분석 계층: ${layerSummary}.\n\n추천 예: ${rec.layer} ${rec.label} ${rec.ticker} — ${rec.splitGuide ?? "분할 검토"} (${rec.rationale})\n\n${briefing.disclaimer}`;
    }
    return `분석 계층: ${layerSummary}.\n\n${briefing.disclaimer}`;
  }

  if (/섹터|반도체|에너지|금융/.test(text)) {
    const top = briefing.sectorTop3.map((s) => `${s.label} (수급 ${s.flowScore})`).join(", ");
    return `오늘 섹터 흐름 상위: ${top}.\n${briefing.sections.sectorFlows.inflowNote}\n\n${briefing.disclaimer}`;
  }

  if (/환전|usd|달러|fx/i.test(text)) {
    return `${briefing.fxRebalanceLine}\n\nUSD/KRW ${briefing.sections.fx.usdKrw.toLocaleString("ko-KR")}.\n${briefing.sections.fx.rationale.join(" ")}\n\n${briefing.disclaimer}`;
  }

  if (/티커|종목/.test(text) && !/(등록|추가|샀|구매|매수|삭제|제거)/.test(text)) {
    const tickers = Object.keys(briefing.scenarios[1]?.weightsAfter ?? {}).filter(
      (t) => t !== "CASH"
    );
    return `보유·제안 티커: ${tickers.join(", ")}. Follow(안 1)에서 반도체 비중 확대를 검토 중입니다 (참고용).\n\n${briefing.disclaimer}`;
  }

  return null;
}
