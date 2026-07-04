import { AGENT_SECTOR_LABELS, type AgentSectorId } from "@/config/agent";
import type { AssetType, HoldingsSnapshot } from "@/types/agent";
import type { ValuationResult } from "@/lib/agent/valuation";
import { resolveHoldingSector, roundWeight } from "@/lib/agent/weights";

export type AssetClassId = "equity" | "bond" | "cash" | "commodity";

export const ASSET_CLASS_LABELS: Record<AssetClassId, string> = {
  equity: "주식·ETF",
  bond: "채권",
  cash: "현금",
  commodity: "원자재·금",
};

export function resolveAssetClass(holding: {
  assetType: AssetType;
  sector?: string;
}): AssetClassId {
  if (holding.assetType === "bond_etf") return "bond";
  if (holding.assetType === "gold_etf") return "commodity";
  if (holding.sector === "gold" || holding.sector === "bonds") {
    return holding.sector === "bonds" ? "bond" : "commodity";
  }
  return "equity";
}

export interface WeightRow {
  id: string;
  label: string;
  weightPct: number;
}

export function computeAssetClassWeights(
  valuation: ValuationResult,
  snapshot: HoldingsSnapshot
): WeightRow[] {
  const total = valuation.totalKrw;
  if (total <= 0) return [];

  const byClass: Record<AssetClassId, number> = {
    equity: 0,
    bond: 0,
    cash: valuation.cashKrw,
    commodity: 0,
  };

  for (const h of valuation.holdings) {
    const snap = snapshot.holdings.find((s) => s.id === h.id || s.ticker === h.ticker);
    const cls = resolveAssetClass({
      assetType: snap?.assetType ?? "stock",
      sector: snap?.sector,
    });
    byClass[cls] += h.valueKrw;
  }

  return (Object.entries(byClass) as [AssetClassId, number][])
    .filter(([, krw]) => krw > 0)
    .map(([id, krw]) => ({
      id,
      label: ASSET_CLASS_LABELS[id],
      weightPct: roundWeight((krw / total) * 100),
    }))
    .toSorted((a, b) => b.weightPct - a.weightPct);
}

export function computeSubSectorWeights(
  valuation: ValuationResult,
  snapshot: HoldingsSnapshot
): WeightRow[] {
  const total = valuation.totalKrw;
  if (total <= 0) return [];

  const bySector: Record<string, number> = {};
  for (const h of valuation.holdings) {
    const snap = snapshot.holdings.find((s) => s.id === h.id || s.ticker === h.ticker);
    const sector = resolveHoldingSector(h.ticker, snap?.sector);
    bySector[sector] = (bySector[sector] ?? 0) + h.valueKrw;
  }

  return Object.entries(bySector)
    .map(([sector, krw]) => ({
      id: sector,
      label:
        sector === "other"
          ? "기타"
          : (AGENT_SECTOR_LABELS[sector as AgentSectorId] ?? sector),
      weightPct: roundWeight((krw / total) * 100),
    }))
    .toSorted((a, b) => b.weightPct - a.weightPct);
}
