import {
  AGENT_SECTOR_LABELS,
  KNOWN_TICKER_CLASSIFICATIONS,
  type AgentSectorId,
} from "@/config/agent";
import type { HoldingsSnapshot } from "@/types/agent";
import type { ValuationResult } from "./valuation";

export function roundWeight(n: number): number {
  return Math.round(n * 10) / 10;
}

export function normalizeWeights(weights: Record<string, number>): Record<string, number> {
  const sum = Object.values(weights).reduce((a, b) => a + b, 0);
  const diff = 100 - sum;
  if (Math.abs(diff) <= 0.05) return weights;

  const adjusted = { ...weights };
  const adjustKey =
    adjusted.CASH != null ? "CASH" : Object.keys(adjusted).sort()[0];
  if (adjustKey) {
    adjusted[adjustKey] = roundWeight((adjusted[adjustKey] ?? 0) + diff);
  }
  return adjusted;
}

/** 시장가치(KRW) 기준 티커·현금 비중(%) */
export function computePortfolioWeights(
  valuation: ValuationResult
): Record<string, number> {
  const total = valuation.totalKrw;
  if (total <= 0) return { CASH: 100 };

  const weights: Record<string, number> = {};
  for (const h of valuation.holdings) {
    weights[h.ticker] = roundWeight((h.valueKrw / total) * 100);
  }
  weights.CASH = roundWeight((valuation.cashKrw / total) * 100);
  return normalizeWeights(weights);
}

export function resolveHoldingSector(
  ticker: string,
  snapshotSector?: string
): AgentSectorId | "other" {
  if (snapshotSector && snapshotSector in AGENT_SECTOR_LABELS) {
    return snapshotSector as AgentSectorId;
  }
  return KNOWN_TICKER_CLASSIFICATIONS[ticker]?.sector ?? "other";
}

export interface SectorWeightRow {
  sector: string;
  label: string;
  weightPct: number;
}

/** 섹터별 KRW 비중 */
export function computeSectorWeights(
  valuation: ValuationResult,
  snapshot: HoldingsSnapshot
): SectorWeightRow[] {
  const total = valuation.totalKrw;
  if (total <= 0) return [];

  const bySector: Record<string, number> = {};
  for (const h of valuation.holdings) {
    const snap = snapshot.holdings.find((s) => s.ticker === h.ticker);
    const sector = resolveHoldingSector(h.ticker, snap?.sector);
    bySector[sector] = (bySector[sector] ?? 0) + h.valueKrw;
  }

  return Object.entries(bySector)
    .map(([sector, krw]) => ({
      sector,
      label:
        sector === "other"
          ? "기타"
          : (AGENT_SECTOR_LABELS[sector as AgentSectorId] ?? sector),
      weightPct: roundWeight((krw / total) * 100),
    }))
    .toSorted((a, b) => b.weightPct - a.weightPct);
}

/** 보유 종목 균형 대비 과대 비중(≥3%p) 티커 */
export function findOverweightTicker(
  weights: Record<string, number>,
  exclude: string[] = ["CASH"]
): string | null {
  const allTickers = Object.keys(weights).filter((t) => t !== "CASH");
  const candidates = allTickers.filter((t) => !exclude.includes(t));
  if (candidates.length === 0) return null;

  const investable = allTickers.reduce((s, t) => s + (weights[t] ?? 0), 0);
  const equalTarget = investable / allTickers.length;

  let maxExcess = 0;
  let pick: string | null = null;
  for (const t of candidates) {
    const excess = (weights[t] ?? 0) - equalTarget;
    if (excess >= 3 && excess > maxExcess) {
      maxExcess = excess;
      pick = t;
    }
  }
  return pick;
}

export function deltaToKrw(deltaPp: number, totalKrw: number): number {
  return Math.round((Math.abs(deltaPp) / 100) * totalKrw);
}

/** 균등(1/n) 또는 선행(50·30·20 / 60·40) 분할 금액 */
export function splitTrancheAmounts(
  totalKrw: number,
  count: number,
  frontLoad: boolean
): number[] {
  if (count <= 1) return [Math.round(totalKrw)];
  if (frontLoad) {
    if (count === 2) {
      return [Math.round(totalKrw * 0.6), Math.round(totalKrw * 0.4)];
    }
    return [
      Math.round(totalKrw * 0.5),
      Math.round(totalKrw * 0.3),
      Math.round(totalKrw * 0.2),
    ];
  }
  const each = Math.round(totalKrw / count);
  const amounts = Array.from({ length: count }, () => each);
  const diff = totalKrw - amounts.reduce((a, b) => a + b, 0);
  amounts[amounts.length - 1] += diff;
  return amounts;
}
