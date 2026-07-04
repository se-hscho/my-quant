import { formatScenarioReference } from "@/config/agent-scenarios";
import type { HoldingsSnapshot } from "@/types/agent";
import { resolveValuation, type PriceSource } from "@/lib/agent/market-data";
import { computeSectorWeights } from "@/lib/agent/weights";
import type { ValuationResult } from "@/lib/agent/valuation";
import { getAnalystReports } from "@/services/analyst/adapter";
import { getContextFixture } from "@/services/context/adapter";
import { getEventsFixture } from "@/services/events/adapter";
import { getSmartMoneyData } from "@/services/smart-money/adapter";
import type { SmartMoneyData } from "@/services/briefing/types";
import { fetchYahooPriceTrend } from "@/lib/agent/yahoo-quote";
import {
  buildHoldingInsightRows,
  generateLlmBriefingNarrative,
} from "./llm-narrative";
import { computeWeightedPortfolioReturns } from "./portfolio-returns";
import { diffBriefings } from "./diff";
import { getBriefing } from "./kv";
import { isCashOnlySnapshot } from "@/lib/agent/snapshot-mode";
import { buildScenarios } from "./scenarios";
import { buildBriefingRecommendations } from "./recommendations";
import {
  buildCashDeploymentScenarios,
  buildInvestmentDirection,
  deploymentSummaryLines,
} from "./cash-deployment";
import { BRIEFING_DISCLAIMER, type Briefing } from "./types";

export interface GenerateBriefingInput {
  snapshot: HoldingsSnapshot;
  date?: string;
  forceFail?: boolean;
  /** 미보유 데모 — Yahoo/KV 실패 시 참고 시세 seed 사용 */
  allowDemoFallback?: boolean;
}

function priceSourceDisclaimer(source: PriceSource): string {
  if (source === "yahoo") return "";
  if (source === "yahoo-partial") {
    return " 일부 시세는 Yahoo 연동 실패로 참고용 추정치를 사용했습니다.";
  }
  return " 시세·환율 연동에 실패해 참고용 추정치(데모 seed)로 계산했습니다.";
}

function sectorTop3(
  snapshot: HoldingsSnapshot,
  valuation: ValuationResult,
  smartMoney: SmartMoneyData
) {
  const sectorWeights = computeSectorWeights(valuation, snapshot);
  const weightBySector = Object.fromEntries(
    sectorWeights.map((s) => [s.sector, s.weightPct])
  );

  return smartMoney.sectorFlows
    .toSorted((a, b) => b.flowScore - a.flowScore)
    .slice(0, 3)
    .map((f) => ({
      sector: f.sector,
      label: f.label,
      weightPct: weightBySector[f.sector] ?? 0,
      flowScore: f.flowScore,
    }));
}

export async function generateBriefing(
  input: GenerateBriefingInput
): Promise<Briefing> {
  if (input.forceFail) {
    throw new Error("briefing generation forced fail");
  }

  const date = input.date ?? new Date().toISOString().slice(0, 10);
  const resolved = await resolveValuation(input.snapshot, {
    allowDemoFallback: input.allowDemoFallback,
  });
  if (!resolved) {
    throw new Error("FX or price data unavailable");
  }
  const { valuation, priceSource } = resolved;
  const smartMoney = await getSmartMoneyData();
  const context = getContextFixture();
  const events = getEventsFixture();
  const deploymentMode = isCashOnlySnapshot(input.snapshot);

  let investmentDirection = undefined;
  let scenarios = buildScenarios(input.snapshot, valuation);

  if (deploymentMode) {
    investmentDirection = buildInvestmentDirection({
      snapshot: input.snapshot,
      valuation,
      smartMoney,
      context,
    });
    scenarios = buildCashDeploymentScenarios({
      snapshot: input.snapshot,
      valuation,
      direction: investmentDirection,
    });
  }

  const { guide: analysisGuide, rows: recommendationRows } = buildBriefingRecommendations({
    snapshot: input.snapshot,
    valuation,
    smartMoney,
    scenarios,
  });

  const trendsByTicker: Record<string, Awaited<ReturnType<typeof fetchYahooPriceTrend>>> = {};
  await Promise.all(
    valuation.holdings.map(async (h) => {
      trendsByTicker[h.ticker.toUpperCase()] = await fetchYahooPriceTrend(h.ticker);
    })
  );

  const portfolioReturns = computeWeightedPortfolioReturns({
    valuation,
    trendsByTicker,
  });

  const holdingInsights = buildHoldingInsightRows({
    snapshot: input.snapshot,
    valuation,
    trendsByTicker,
  });

  const llmNarrative = await generateLlmBriefingNarrative({
    snapshot: input.snapshot,
    valuation,
    smartMoney,
    holdings: holdingInsights,
    portfolioReturns,
  });
  const tickers = input.snapshot.holdings.map((h) => h.ticker);
  const analystReports = await getAnalystReports(
    deploymentMode
      ? scenarios[1]?.playbook
          .filter((p) => p.ticker)
          .map((p) => p.ticker!)
          .filter((t, i, a) => a.indexOf(t) === i) ?? []
      : tickers
  );

  const prev = await getBriefing(
    new Date(Date.parse(date) - 86400000).toISOString().slice(0, 10)
  );

  const fxRebalanceLine = deploymentMode
    ? `신규 배분 — USD ETF 포함 시 KRW→USD 환전을 분할 매수 1차와 함께 검토 (참고용)`
    : input.snapshot.cash.usd < 5000
      ? `USD 현금 부족 — KRW→USD 환전 약 ${Math.round(5000 * valuation.fx.usdKrw).toLocaleString("ko-KR")}원 상당을 이번 주 검토 (참고용)`
      : "통화별 현금 균형 유지 — 즉시 환전 필요성 낮음 (참고용)";

  const summaryLines = deploymentMode && investmentDirection
    ? deploymentSummaryLines(investmentDirection, valuation.totalKrw)
    : llmNarrative?.executiveLines?.length
      ? llmNarrative.executiveLines
      : [
          `총자산 ${Math.round(valuation.totalKrw).toLocaleString("ko-KR")}원 — 반도체 수급 강세, ${formatScenarioReference(1)} 검토 구간.`,
          `외국인 순매수·기관 매도 — ${formatScenarioReference(2)} 또는 ${formatScenarioReference(3)} 대안.`,
          fxRebalanceLine,
          events.some((e) => e.phase === "today")
            ? `오늘 ${events.find((e) => e.phase === "today")?.title} — 이벤트 전 환전·재원 확보 우선.`
            : `임박 이벤트 없음 — ${formatScenarioReference(0)} vs ${formatScenarioReference(1)} 비교.`,
        ];

  if (!deploymentMode && valuation.holdingsReturnPct != null && !llmNarrative) {
    summaryLines.splice(
      1,
      0,
      `보유 수익률 ${valuation.holdingsReturnPct >= 0 ? "+" : ""}${valuation.holdingsReturnPct.toFixed(1)}% — 손익 구간·섹터 흐름에 따라 추가 매수·차익실현·관찰 가이드가 조정됩니다 (참고용).`
    );
  }

  const briefing: Briefing = {
    date,
    summaryLines,
    totalAssetsKrw: valuation.totalKrw,
    cash: input.snapshot.cash,
    sectorTop3: sectorTop3(input.snapshot, valuation, smartMoney),
    scenarioComparison: scenarios.map((s) => ({
      id: s.id,
      label: s.label,
      expectedReturn: s.expectedReturn,
      expectedVolatility: s.expectedVolatility,
    })),
    fxRebalanceLine,
    scenarios,
    sections: {
      portfolio: {
        returns: {
          d1: portfolioReturns.d1,
          d7: portfolioReturns.d7,
          m1: portfolioReturns.m1,
          q1: portfolioReturns.m1 * 1.8,
          ytd: portfolioReturns.m1 * 3,
        },
        holdingsReturnPct: valuation.holdingsReturnPct,
        holdingsPnlKrw: valuation.holdingsPnlKrw,
        caption: deploymentMode
          ? `신규 배분 — 현금 ${Math.round(valuation.totalKrw).toLocaleString("ko-KR")}원, 보유 0종목`
          : valuation.holdingsReturnPct != null
            ? `매수가 기준 수익률 ${valuation.holdingsReturnPct >= 0 ? "+" : ""}${valuation.holdingsReturnPct.toFixed(1)}% · 7일 ${portfolioReturns.d7 >= 0 ? "+" : ""}${portfolioReturns.d7.toFixed(1)}% (참고용)`
            : "포트폴리오 수익률 스냅샷 — Yahoo 일봉·환율 KRW 환산 (참고용)",
        help: deploymentMode
          ? [
              "현금 100%에서 목표 비중으로 이동하는 신규 배분 모드입니다.",
              "종목 조합·분할 일정은 투자 방향 섹션과 playbook을 함께 보세요.",
            ]
          : valuation.holdingsReturnPct != null
            ? [
                "매수가 기준 보유 수익률은 추천·playbook에 반영됩니다.",
                "고수익=차익실현, 손실+유출=축소, 유입+눌림=분할 추가 매수를 검토하세요.",
              ]
            : [
                "7일·분기·YTD는 Yahoo 일봉과 환율을 KRW로 환산한 참고치입니다.",
                "실제 체결가·배당은 반영되지 않을 수 있습니다.",
              ],
      },
      fx: {
        usdKrw: valuation.fx.usdKrw,
        jpyKrw: valuation.fx.jpyKrw,
        trend: [
          { date: "D-4", rate: valuation.fx.usdKrw * 0.99 },
          { date: "D-3", rate: valuation.fx.usdKrw * 0.995 },
          { date: "D-2", rate: valuation.fx.usdKrw * 1.002 },
          { date: "D-1", rate: valuation.fx.usdKrw * 1.005 },
          { date: "D0", rate: valuation.fx.usdKrw },
        ],
        rebalanceTiming: input.snapshot.cash.usd < 5000 ? "이번 주" : "관망",
        rebalanceAmountKrw: input.snapshot.cash.usd < 5000 ? 5000 * valuation.fx.usdKrw : 0,
        rebalanceAmountUsd: input.snapshot.cash.usd < 5000 ? 5000 : 0,
        rationale: [
          "USD 자산 매수 전 환전 스프레드(0.3%)를 감안한 금액입니다.",
          "급격한 환율 변동 시 최소변경 (3안)으로 환전 단계를 나누세요.",
        ],
      },
      smartMoney,
      sectorFlows: {
        rows: smartMoney.sectorFlows,
        inflowNote:
          "유입 상위: 반도체·기술 — 외국인 순매수 참고 데이터와 정합. 보유 여부와 무관하게 전 섹터 표시.",
        outflowNote: "유출: 금융·유틸리티 — 방어적 로테이션 구간으로 해석.",
      },
      context: { items: context },
      events: { timeline: events },
      institutional: { paragraphs: smartMoney.institutionalLens },
      analysisGuide,
      investmentDirection,
      recommendations: { rows: recommendationRows },
      analyst: { reports: analystReports },
      llmNarrative: llmNarrative ?? undefined,
    },
    disclaimer: `${BRIEFING_DISCLAIMER}${priceSourceDisclaimer(priceSource)}`,
    status: "complete",
  };

  briefing.sections.diff = diffBriefings(prev, briefing);

  if (analystReports.length > 0) {
    briefing.summaryLines.push(
      `애널 ${analystReports[0].broker} ${analystReports[0].rating} — ${analystReports[0].ticker} · ${formatScenarioReference(1)} 정합 검토.`
    );
  }

  return briefing;
}
