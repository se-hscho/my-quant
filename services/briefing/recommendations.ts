import {
  INFLOW_THRESHOLD,
  OUTFLOW_THRESHOLD,
  OVERWEIGHT_MIN_PP,
  SECTOR_PROXY_TICKERS,
} from "@/config/agent-analysis-guide";
import { AGENT_SECTOR_LABELS, KNOWN_TICKER_CLASSIFICATIONS, type AgentSectorId } from "@/config/agent";
import { buildAnalysisGuideSnapshot } from "@/lib/agent/analysis-layers";
import { classifyReturnSignal, formatReturnPct } from "@/lib/agent/return-signals";
import { inferRegionFromTicker } from "@/lib/agent/sector-classify";
import type { ValuationResult } from "@/lib/agent/valuation";
import { deltaToKrw } from "@/lib/agent/weights";
import {
  computePortfolioWeights,
  findOverweightTicker,
  resolveHoldingSector,
} from "@/lib/agent/weights";
import type { HoldingsSnapshot } from "@/types/agent";
import type {
  AnalysisGuideSnapshot,
  BriefingScenario,
  BriefingScenarioId,
  PlaybookStep,
  RecommendationRow,
  SmartMoneyData,
} from "./types";

export interface BriefingRecommendationsResult {
  guide: AnalysisGuideSnapshot;
  rows: RecommendationRow[];
}

function heldSectorIds(snapshot: HoldingsSnapshot): Set<string> {
  const ids = new Set<string>();
  for (const h of snapshot.holdings) {
    const sector =
      h.sector ?? KNOWN_TICKER_CLASSIFICATIONS[h.ticker]?.sector ?? resolveHoldingSector(h.ticker);
    if (sector !== "other") ids.add(sector);
  }
  return ids;
}

function dominantRegion(snapshot: HoldingsSnapshot): "KR" | "US" {
  let kr = 0;
  let us = 0;
  for (const h of snapshot.holdings) {
    const r = h.region ?? inferRegionFromTicker(h.ticker);
    if (r === "KR") kr += 1;
    else if (r === "US") us += 1;
    else us += 1;
  }
  return kr >= us ? "KR" : "US";
}

function pickProxyTicker(sector: AgentSectorId, snapshot: HoldingsSnapshot): string {
  const proxy = SECTOR_PROXY_TICKERS[sector];
  if (!proxy) return sector === "semiconductor" ? "SOXX" : "QQQ";
  const region = dominantRegion(snapshot);
  if (region === "KR" && proxy.kr) return proxy.kr;
  return proxy.us;
}

function splitGuideFromPlaybook(
  playbook: PlaybookStep[],
  ticker: string,
  action: "buy" | "sell"
): string | undefined {
  const steps = playbook.filter(
    (s) => s.ticker === ticker && s.action === action && s.trancheTotal != null && s.trancheTotal > 1
  );
  if (steps.length === 0) return undefined;
  const total = steps[0].trancheTotal!;
  if (steps.length >= 2 && steps[0].amountKrw != null && steps[1].amountKrw != null) {
    if (steps[0].amountKrw > steps[1].amountKrw) {
      return `선행 ${total}분할 (50·30·20)`;
    }
  }
  return `균등 ${total}분할`;
}

function holdingInSector(snapshot: HoldingsSnapshot, sector: string): string | undefined {
  return snapshot.holdings.find(
    (h) =>
      h.sector === sector ||
      KNOWN_TICKER_CLASSIFICATIONS[h.ticker]?.sector === sector
  )?.ticker;
}

function buildSignals(input: {
  layer: RecommendationRow["layer"];
  flowScore?: number;
  relativeStrength7d?: number;
  currentWeightPct?: number;
  targetDeltaPp?: number;
  owned?: boolean;
  smartMoney?: SmartMoneyData;
  returnPct?: number;
}): string[] {
  const signals: string[] = [];
  if (input.layer === "L3" && input.flowScore != null) {
    signals.push(`L3 섹터 수급 점수 ${(input.flowScore * 100).toFixed(0)}/100`);
  }
  if (input.relativeStrength7d != null) {
    signals.push(`7일 상대강도 ${input.relativeStrength7d >= 0 ? "+" : ""}${input.relativeStrength7d.toFixed(1)}%p`);
  }
  if (input.currentWeightPct != null) {
    signals.push(`현재 비중 ${input.currentWeightPct}%`);
  }
  if (input.targetDeltaPp != null) {
    signals.push(`목표 Δ ${input.targetDeltaPp > 0 ? "+" : ""}${input.targetDeltaPp}%p`);
  }
  if (input.owned === false) {
    signals.push("L3 유입 · L4 미보유 — 신규 편입 검토");
  } else if (input.owned === true && input.targetDeltaPp != null && input.targetDeltaPp > 0) {
    signals.push("L4 보유 · L3 유입 정합 — 비중 확대 검토");
  }
  if (input.returnPct != null) {
    signals.push(`매수가 대비 수익률 ${input.returnPct >= 0 ? "+" : ""}${input.returnPct.toFixed(1)}%`);
  }
  if (input.smartMoney && input.flowScore != null && input.flowScore > INFLOW_THRESHOLD) {
    signals.push("스마트 머니 유입 방향과 정합 (참고용)");
  }
  return signals;
}

export function buildBriefingRecommendations(input: {
  snapshot: HoldingsSnapshot;
  valuation: ValuationResult;
  smartMoney: SmartMoneyData;
  scenarios: BriefingScenario[];
}): BriefingRecommendationsResult {
  const guide = buildAnalysisGuideSnapshot(input.snapshot, input.valuation);
  const weights = computePortfolioWeights(input.valuation);
  const heldSectors = heldSectorIds(input.snapshot);
  const rows: RecommendationRow[] = [];
  let rowId = 0;

  const follow = input.scenarios.find((s) => s.id === 1);
  const lead = input.scenarios.find((s) => s.id === 2);
  const minChange = input.scenarios.find((s) => s.id === 3);

  const sortedFlows = input.smartMoney.sectorFlows.toSorted(
    (a, b) => b.flowScore - a.flowScore
  );

  for (const flow of sortedFlows) {
    if (flow.flowScore < INFLOW_THRESHOLD) continue;

    const sector = flow.sector as AgentSectorId;
    const owned = heldSectors.has(flow.sector);
    const existingTicker = holdingInSector(input.snapshot, flow.sector);
    const ticker = existingTicker ?? pickProxyTicker(sector, input.snapshot);
    const currentWeight = existingTicker ? weights[existingTicker] : 0;

    const followBuy = follow?.playbook.find(
      (p) => p.action === "buy" && p.ticker === ticker
    );
    const followDelta =
      follow && existingTicker
        ? roundDelta(
            (follow.weightsAfter[ticker] ?? 0) - (follow.weightsBefore[ticker] ?? 0)
          )
        : owned
          ? 3
          : 4;

    const splitGuide =
      (follow && splitGuideFromPlaybook(follow.playbook, ticker, "buy")) ??
      (lead && splitGuideFromPlaybook(lead.playbook, ticker, "buy")) ??
      (owned ? "균등 3분할" : "균등 3분할 — 신규");

    rows.push({
      id: `rec-${rowId++}`,
      layer: owned ? "L4" : "L3",
      action: owned ? "buy" : "new_sector",
      sector: flow.sector,
      label: flow.label,
      ticker,
      currentWeightPct: currentWeight,
      targetDeltaPp: followDelta,
      amountKrw: deltaToKrw(Math.abs(followDelta), input.valuation.totalKrw),
      splitGuide,
      scenarioId: 1,
      rationale: owned
        ? `${flow.label} 섹터 유입 — 보유 ${ticker} 비중 확대를 Follow(안 1)에서 ${splitGuide ?? "분할"}로 검토 (참고용)`
        : `${flow.label} 섹터 유입 — 미보유 · 대표 ${ticker} 신규 편입을 ${splitGuide ?? "분할"}로 검토 (참고용)`,
      signals: buildSignals({
        layer: owned ? "L4" : "L3",
        flowScore: flow.flowScore,
        relativeStrength7d: flow.relativeStrength7d,
        currentWeightPct: currentWeight,
        targetDeltaPp: followDelta,
        owned,
        smartMoney: input.smartMoney,
      }),
    });
  }

  for (const flow of sortedFlows) {
    if (flow.flowScore > OUTFLOW_THRESHOLD) continue;
    const existingTicker = holdingInSector(input.snapshot, flow.sector);
    if (!existingTicker) continue;

    const reducePp = 2;
    const splitGuide =
      minChange && splitGuideFromPlaybook(minChange.playbook, existingTicker, "sell");

    rows.push({
      id: `rec-${rowId++}`,
      layer: "L4",
      action: "sell",
      sector: flow.sector,
      label: flow.label,
      ticker: existingTicker,
      currentWeightPct: weights[existingTicker],
      targetDeltaPp: -reducePp,
      amountKrw: deltaToKrw(reducePp, input.valuation.totalKrw),
      splitGuide: splitGuide ?? "2분할 — 소량",
      scenarioId: 3,
      rationale: `${flow.label} 섹터 유출 — 보유 ${existingTicker} 축소를 최소변경(안 3)에서 검토 (참고용)`,
      signals: buildSignals({
        layer: "L4",
        flowScore: flow.flowScore,
        relativeStrength7d: flow.relativeStrength7d,
        currentWeightPct: weights[existingTicker],
        targetDeltaPp: -reducePp,
        owned: true,
      }),
    });
  }

  const overweight = findOverweightTicker(weights);
  if (overweight && follow) {
    const before = follow.weightsBefore[overweight] ?? 0;
    const after = follow.weightsAfter[overweight] ?? 0;
    const sellPp = roundDelta(before - after);

    if (sellPp >= 1) {
      const snap = input.snapshot.holdings.find((h) => h.ticker === overweight);
      const sector = resolveHoldingSector(overweight, snap?.sector);
      rows.push({
        id: `rec-${rowId++}`,
        layer: "L4",
        action: "sell",
        sector: sector === "other" ? "other" : sector,
        label:
          sector === "other"
            ? "과대 비중"
            : (AGENT_SECTOR_LABELS[sector as AgentSectorId] ?? sector),
        ticker: overweight,
        currentWeightPct: weights[overweight],
        targetDeltaPp: -sellPp,
        amountKrw: deltaToKrw(sellPp, input.valuation.totalKrw),
        splitGuide:
          splitGuideFromPlaybook(follow.playbook, overweight, "sell") ?? "균등 3분할",
        scenarioId: 1,
        rationale: `${overweight} 과대 비중(≥${OVERWEIGHT_MIN_PP}%p) — 재원 확보 후 유입 섹터 매수에 연결 (참고용)`,
        signals: [
          `L4 과대 비중 ${weights[overweight]}%`,
          "균형 대비 초과 — 분할 매도 후 Follow 매수 재원",
        ],
      });
    }
  }

  const unique = dedupeRecommendations([
    ...rows,
    ...buildReturnAwareRecommendations(input, weights, rowId),
  ]);
  return { guide, rows: unique.slice(0, 10) };
}

function sectorFlowScore(smartMoney: SmartMoneyData, ticker: string, snapshot: HoldingsSnapshot): number | undefined {
  const snap = snapshot.holdings.find((h) => h.ticker === ticker);
  const sector =
    snap?.sector ??
    KNOWN_TICKER_CLASSIFICATIONS[ticker]?.sector ??
    resolveHoldingSector(ticker, snap?.sector);
  if (sector === "other") return undefined;
  return smartMoney.sectorFlows.find((f) => f.sector === sector)?.flowScore;
}

function buildReturnAwareRecommendations(
  input: {
    snapshot: HoldingsSnapshot;
    valuation: ValuationResult;
    smartMoney: SmartMoneyData;
    scenarios: BriefingScenario[];
  },
  weights: Record<string, number>,
  startId: number
): RecommendationRow[] {
  const rows: RecommendationRow[] = [];
  let rowId = startId;
  const follow = input.scenarios.find((s) => s.id === 1);
  const minChange = input.scenarios.find((s) => s.id === 3);

  for (const hv of input.valuation.holdings) {
    const flowScore = sectorFlowScore(input.smartMoney, hv.ticker, input.snapshot);
    const signal = classifyReturnSignal(hv, flowScore);
    if (!signal) continue;

    const snap = input.snapshot.holdings.find((h) => h.id === hv.id);
    const sector = resolveHoldingSector(hv.ticker, snap?.sector);
    const sectorLabel =
      sector === "other"
        ? "보유 종목"
        : (AGENT_SECTOR_LABELS[sector as AgentSectorId] ?? sector);
    const weight = weights[hv.ticker] ?? 0;

    if (signal.hint === "take_profit") {
      const sellPp = 3;
      rows.push({
        id: `rec-ret-${rowId++}`,
        layer: "L4",
        action: "sell",
        sector: sector === "other" ? "other" : sector,
        label: sectorLabel,
        ticker: hv.ticker,
        currentWeightPct: weight,
        targetDeltaPp: -sellPp,
        returnPct: signal.returnPct,
        amountKrw: deltaToKrw(sellPp, input.valuation.totalKrw),
        splitGuide:
          (follow && splitGuideFromPlaybook(follow.playbook, hv.ticker, "sell")) ??
          "2분할 — 차익실현",
        scenarioId: 1,
        rationale: `${hv.ticker} ${formatReturnPct(signal.returnPct)} — 수익 구간·과대 비중 시 분할 매도 검토 (참고용)`,
        signals: [signal.reason, `현재 비중 ${weight}%`],
      });
    } else if (signal.hint === "cut_loss") {
      const sellPp = 3;
      rows.push({
        id: `rec-ret-${rowId++}`,
        layer: "L4",
        action: "sell",
        sector: sector === "other" ? "other" : sector,
        label: sectorLabel,
        ticker: hv.ticker,
        currentWeightPct: weight,
        targetDeltaPp: -sellPp,
        returnPct: signal.returnPct,
        amountKrw: deltaToKrw(sellPp, input.valuation.totalKrw),
        splitGuide:
          (minChange && splitGuideFromPlaybook(minChange.playbook, hv.ticker, "sell")) ??
          "2분할 — 소량",
        scenarioId: 3,
        rationale: `${hv.ticker} ${formatReturnPct(signal.returnPct)} — 손실·섹터 유출 겹침, 축소 검토 (참고용)`,
        signals: [signal.reason],
      });
    } else if (signal.hint === "dip_add") {
      const buyPp = 2;
      rows.push({
        id: `rec-ret-${rowId++}`,
        layer: "L4",
        action: "buy",
        sector: sector === "other" ? "other" : sector,
        label: sectorLabel,
        ticker: hv.ticker,
        currentWeightPct: weight,
        targetDeltaPp: buyPp,
        returnPct: signal.returnPct,
        amountKrw: deltaToKrw(buyPp, input.valuation.totalKrw),
        splitGuide:
          (follow && splitGuideFromPlaybook(follow.playbook, hv.ticker, "buy")) ??
          "균등 3분할 — 추가",
        scenarioId: 1,
        rationale: `${hv.ticker} ${formatReturnPct(signal.returnPct)} — 유입 섹터 조정(눌림) 분할 추가 매수 검토 (참고용)`,
        signals: [signal.reason],
      });
    } else if (signal.hint === "hold_loss") {
      rows.push({
        id: `rec-ret-${rowId++}`,
        layer: "L4",
        action: "hold",
        sector: sector === "other" ? "other" : sector,
        label: sectorLabel,
        ticker: hv.ticker,
        currentWeightPct: weight,
        returnPct: signal.returnPct,
        scenarioId: 3,
        rationale: `${hv.ticker} ${formatReturnPct(signal.returnPct)} — 추가 매수보다 회복·섹터 흐름 관찰 (참고용)`,
        signals: [signal.reason],
      });
    }
  }

  return rows;
}

function roundDelta(n: number): number {
  return Math.round(n * 10) / 10;
}

function dedupeRecommendations(rows: RecommendationRow[]): RecommendationRow[] {
  const seen = new Set<string>();
  return rows.filter((r) => {
    const key = `${r.action}-${r.ticker}-${r.scenarioId}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function recommendationActionLabel(action: RecommendationRow["action"]): string {
  switch (action) {
    case "new_sector":
      return "신규 섹터";
    case "buy":
      return "비중 확대";
    case "sell":
      return "비중 축소";
    case "fx":
      return "환전";
    default:
      return "유지";
  }
}
