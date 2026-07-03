import type { HoldingsSnapshot } from "@/types/agent";
import { AGENT_SECTORS, SECTOR_FLOW_FIXTURE } from "@/config/agent";
import { computeValuation, type ValuationResult } from "@/lib/agent/valuation";
import { fetchFxRatesFromYahoo, fetchYahooLatestClose } from "@/lib/agent/yahoo-quote";
import { getAnalystReports } from "@/services/analyst/adapter";
import { getContextFixture } from "@/services/context/adapter";
import { getEventsFixture } from "@/services/events/adapter";
import { getSmartMoneyFixture } from "@/services/smart-money/adapter";
import { diffBriefings } from "./diff";
import { getBriefing } from "./kv";
import { buildScenarios } from "./scenarios";
import { BRIEFING_DISCLAIMER, type Briefing } from "./types";

export interface GenerateBriefingInput {
  snapshot: HoldingsSnapshot;
  date?: string;
  forceFail?: boolean;
}

async function fetchValuation(snapshot: HoldingsSnapshot): Promise<ValuationResult | null> {
  const fxRaw = await fetchFxRatesFromYahoo();
  if (!fxRaw.usdKrw || !fxRaw.jpyKrw) return null;
  const fx = { usdKrw: fxRaw.usdKrw, jpyKrw: fxRaw.jpyKrw };
  const tickers = [...new Set(snapshot.holdings.map((h) => h.ticker.toUpperCase()))];
  const prices = Object.fromEntries(
    await Promise.all(
      tickers.map(async (t) => [t, await fetchYahooLatestClose(t)] as const)
    )
  );
  return computeValuation(snapshot, prices, fx);
}

function sectorTop3(snapshot: HoldingsSnapshot, totalKrw: number) {
  const smart = getSmartMoneyFixture();
  return SECTOR_FLOW_FIXTURE.toSorted((a, b) => b.flowScore - a.flowScore)
    .slice(0, 3)
    .map((f) => ({
      sector: f.sector,
      label: f.label,
      weightPct:
        totalKrw > 0
          ? Math.round(
              (snapshot.holdings.filter(
                (h) =>
                  (h.sector ?? "") === f.sector ||
                  h.ticker.startsWith("005930")
              ).length /
                Math.max(snapshot.holdings.length, 1)) *
                100
            )
          : 0,
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
  const valuation = await fetchValuation(input.snapshot);
  if (!valuation) {
    throw new Error("FX or price data unavailable");
  }

  const scenarios = buildScenarios(
    input.snapshot,
    valuation.totalKrw,
    valuation.fx.usdKrw
  );
  const smartMoney = getSmartMoneyFixture();
  const context = getContextFixture();
  const events = getEventsFixture();
  const tickers = input.snapshot.holdings.map((h) => h.ticker);
  const analyst = getAnalystReports(tickers);

  const prev = await getBriefing(
    new Date(Date.parse(date) - 86400000).toISOString().slice(0, 10)
  );

  const fxRebalanceLine =
    input.snapshot.cash.usd < 5000
      ? `USD 현금 부족 — KRW→USD 환전 약 ${Math.round(5000 * valuation.fx.usdKrw).toLocaleString("ko-KR")}원 상당을 이번 주 검토 (참고용)`
      : "통화별 현금 균형 유지 — 즉시 환전 필요성 낮음 (참고용)";

  const summaryLines = [
    `총자산 ${Math.round(valuation.totalKrw).toLocaleString("ko-KR")}원 — 반도체 수급 강세 구간에서 Follow(안 1) 검토가 유리합니다.`,
    `외국인 순매수·기관 매도 fixture — 개인은 소액·즉시 체결로 선점(안 2) 또는 최소변경(안 3)을 선택할 수 있습니다.`,
    fxRebalanceLine,
    events.some((e) => e.phase === "today")
      ? `오늘 ${events.find((e) => e.phase === "today")?.title} — 이벤트 전 playbook 0단계(환전) 우선 검토.`
      : "임박 이벤트 없음 — 안 0(유지)과 안 1 비교로 시작하세요.",
    "상세 레포트에서 섹터 흐름·playbook·애널 요약을 확인하세요.",
  ];

  const briefing: Briefing = {
    date,
    summaryLines,
    totalAssetsKrw: valuation.totalKrw,
    cash: input.snapshot.cash,
    sectorTop3: sectorTop3(input.snapshot, valuation.totalKrw),
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
        returns: { d1: 0.3, d7: 1.2, m1: 2.8, q1: 5.1, ytd: 8.4 },
        caption: "포트폴리오 스냅샷 — 일봉 기준 (참고용)",
        interpretation: [
          "최근 7일 수익률은 반도체 비중에 따라 변동성이 확대되었습니다.",
          "분기·YTD는 환율 효과가 포함된 KRW 환산 추정치입니다.",
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
          "급격한 환율 변동 시 안 3(환전만)으로 단계를 나누는 것을 고려하세요.",
        ],
      },
      smartMoney,
      sectorFlows: {
        rows: smartMoney.sectorFlows,
        inflowNote:
          "유입 상위: 반도체·기술 — 외국인 순매수 fixture와 정합. 보유 여부와 무관하게 전 섹터 표시.",
        outflowNote: "유출: 금융·유틸리티 — 방어적 로테이션 구간으로 해석.",
      },
      context: { items: context },
      events: { timeline: events },
      institutional: { paragraphs: smartMoney.institutionalLens },
      recommendations: {
        rows: smartMoney.sectorFlows
          .filter((s) => s.flowScore > 0.5)
          .slice(0, 3)
          .map((s) => ({
            sector: s.sector,
            label: s.label,
            ticker: s.sector === "semiconductor" ? "SOXX" : "QQQ",
            rationale: `${s.label} 섹터 7일 상대강도 +${s.relativeStrength7d.toFixed(1)}%p — 유입 검토·고려 (참고용)`,
          })),
      },
    },
    disclaimer: BRIEFING_DISCLAIMER,
    status: "complete",
  };

  briefing.sections.diff = diffBriefings(prev, briefing);

  if (analyst.length > 0) {
    briefing.summaryLines.push(
      `애널 ${analyst[0].broker} ${analyst[0].rating} — ${analyst[0].ticker} Follow 안과 정합 검토.`
    );
  }

  return briefing;
}
