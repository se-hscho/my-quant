import {
  formatScenarioHeading,
  formatScenarioReference,
  SCENARIO_DISPLAY,
} from "@/config/agent-scenarios";
import { formatKrw } from "@/lib/agent/valuation";
import type { Briefing } from "@/services/briefing/types";
import { recommendationActionLabel } from "@/services/briefing/recommendations";

export interface ReportKeyMetric {
  label: string;
  value: string;
  note?: string;
}

export interface ReportTocItem {
  id: string;
  chapter: string;
  title: string;
}

export interface ReportActionItem {
  priority: number;
  text: string;
}

export interface ReportExecutiveSummary {
  thesis: string;
  conclusions: string[];
  keyMetrics: ReportKeyMetric[];
  actionItems: ReportActionItem[];
  recommendedScenario?: string;
}

export const REPORT_CHAPTERS = {
  summary: { id: "chapter-summary", chapter: "I", title: "투자 요약" },
  portfolio: { id: "chapter-portfolio", chapter: "II", title: "포트폴리오 현황" },
  market: { id: "chapter-market", chapter: "III", title: "시장·거시 환경" },
  sector: { id: "chapter-sector", chapter: "IV", title: "섹터 분석" },
  strategy: { id: "chapter-strategy", chapter: "V", title: "투자 전략·검토안" },
  scenario: { id: "chapter-scenario", chapter: "VI", title: "시나리오 분석" },
  execution: { id: "chapter-execution", chapter: "VII", title: "실행 계획" },
  changes: { id: "chapter-changes", chapter: "VIII", title: "전일 대비 변경" },
} as const;

export function buildReportToc(hasDiff: boolean, deploymentMode: boolean): ReportTocItem[] {
  const items: ReportTocItem[] = [
    REPORT_CHAPTERS.summary,
    REPORT_CHAPTERS.portfolio,
    REPORT_CHAPTERS.market,
    REPORT_CHAPTERS.sector,
    {
      ...REPORT_CHAPTERS.strategy,
      title: deploymentMode ? "신규 배분 전략" : "투자 전략·검토안",
    },
    REPORT_CHAPTERS.scenario,
    REPORT_CHAPTERS.execution,
  ];
  if (hasDiff) items.push(REPORT_CHAPTERS.changes);
  return items;
}

export function buildReportExecutiveSummary(briefing: Briefing): ReportExecutiveSummary {
  const deploymentMode = briefing.sections.investmentDirection?.mode === "deployment";
  const topSector = briefing.sectorTop3[0];
  const recRows = briefing.sections.recommendations.rows.slice(0, 3);
  const dir = briefing.sections.investmentDirection;

  const recommendedScenario = dir
    ? formatScenarioReference(dir.recommendedScenarioId)
    : formatScenarioReference(1);

  const thesis = deploymentMode
    ? `${formatKrw(briefing.totalAssetsKrw)} 현금 — 시장·정책 맥락 기반 단계적 배분 검토`
    : topSector
      ? `${topSector.label} 섹터 수급 ${(topSector.flowScore * 100).toFixed(0)} — ${formatScenarioReference(1)} 중심 리밸런싱 검토`
      : briefing.summaryLines[0] ?? "당일 포트폴리오 브리핑";

  const keyMetrics: ReportKeyMetric[] = [
    { label: "총자산", value: formatKrw(briefing.totalAssetsKrw) },
  ];

  if (briefing.sections.portfolio.holdingsReturnPct != null) {
    const pct = briefing.sections.portfolio.holdingsReturnPct;
    keyMetrics.push({
      label: "보유 수익률",
      value: `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`,
      note: "매수가 기준",
    });
  }

  const follow = briefing.scenarios.find((s) => s.id === 1);
  if (follow) {
    keyMetrics.push({
      label: `${SCENARIO_DISPLAY[1].shortName} (1안)`,
      value: `수익 ${follow.expectedReturn}% · σ ${follow.expectedVolatility}%`,
      note: "참고용 추정",
    });
  }

  keyMetrics.push({
    label: "환율·환전",
    value: briefing.sections.fx.rebalanceTiming,
    note: `USD/KRW ${briefing.sections.fx.usdKrw.toLocaleString("ko-KR")}`,
  });

  const actionItems: ReportActionItem[] = recRows.map((r, i) => ({
    priority: i + 1,
    text: `${recommendationActionLabel(r.action)} · ${r.label} ${r.ticker}${
      r.targetDeltaPp != null ? ` (${r.targetDeltaPp > 0 ? "+" : ""}${r.targetDeltaPp}%p)` : ""
    }`,
  }));

  if (actionItems.length === 0 && dir) {
    const combo = dir.combinations.find((c) => c.scenarioId === dir.recommendedScenarioId);
    if (combo) {
      actionItems.push({
        priority: 1,
        text: `${recommendedScenario} — ${combo.tickers.map((t) => t.ticker).join(", ")}`,
      });
    }
  }

  return {
    thesis,
    conclusions: briefing.summaryLines.slice(0, 5),
    keyMetrics,
    actionItems,
    recommendedScenario,
  };
}
