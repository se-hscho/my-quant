import { ANALYSIS_LAYERS } from "@/config/agent-analysis-guide";
import { AGENT_SECTOR_LABELS, type AgentSectorId } from "@/config/agent";
import type { HoldingsSnapshot } from "@/types/agent";
import type {
  AnalysisGuideSnapshot,
  AnalysisLayerItem,
  AnalysisLayerSnapshot,
} from "@/types/analysis-guide";
import { computePortfolioWeights, computeSectorWeights, resolveHoldingSector } from "./weights";
import { inferRegionFromTicker } from "./sector-classify";
import type { ValuationResult } from "./valuation";
import { convertToKrw } from "./valuation";
import { classifyReturnSignal, formatReturnPct } from "./return-signals";

type LayerItem = AnalysisLayerItem;

const ASSET_CLASS_LABELS: Record<string, string> = {
  stock: "주식",
  etf: "ETF",
  bond_etf: "채권 ETF",
  gold_etf: "금 ETF",
  cash: "현금",
};

const REGION_LABELS: Record<string, string> = {
  KR: "한국",
  US: "미국",
  JP: "일본",
  other: "기타",
};

function aggregateByKey(
  entries: Array<{ key: string; label: string; krw: number }>,
  totalKrw: number
): LayerItem[] {
  const map = new Map<string, { label: string; krw: number }>();
  for (const e of entries) {
    const prev = map.get(e.key);
    map.set(e.key, {
      label: e.label,
      krw: (prev?.krw ?? 0) + e.krw,
    });
  }
  return [...map.entries()]
    .map(([key, { label, krw }]) => ({
      key,
      label,
      weightPct: totalKrw > 0 ? Math.round((krw / totalKrw) * 1000) / 10 : 0,
    }))
    .toSorted((a, b) => b.weightPct - a.weightPct);
}

export function buildAnalysisGuideSnapshot(
  snapshot: HoldingsSnapshot,
  valuation: ValuationResult
): AnalysisGuideSnapshot {
  const total = valuation.totalKrw;
  const weights = computePortfolioWeights(valuation);

  const l0Items: LayerItem[] = [
    {
      key: "KRW",
      label: "KRW 현금",
      weightPct:
        total > 0 ? Math.round((snapshot.cash.krw / total) * 1000) / 10 : 0,
    },
    {
      key: "USD",
      label: "USD 현금",
      weightPct:
        total > 0
          ? Math.round(
              (convertToKrw(snapshot.cash.usd, "USD", valuation.fx) / total) * 1000
            ) / 10
          : 0,
    },
    {
      key: "JPY",
      label: "JPY 현금",
      weightPct:
        total > 0
          ? Math.round(
              (convertToKrw(snapshot.cash.jpy, "JPY", valuation.fx) / total) * 1000
            ) / 10
          : 0,
    },
  ].filter((i) => i.weightPct > 0);

  const l1Entries: Array<{ key: string; label: string; krw: number }> =
    snapshot.holdings.map((h) => {
      const hv = valuation.holdings.find((v) => v.ticker === h.ticker);
      return {
        key: h.assetType,
        label: ASSET_CLASS_LABELS[h.assetType] ?? h.assetType,
        krw: hv?.valueKrw ?? 0,
      };
    });
  l1Entries.push({ key: "cash", label: "현금", krw: valuation.cashKrw });

  const l2Entries: Array<{ key: string; label: string; krw: number }> =
    snapshot.holdings.map((h) => {
      const hv = valuation.holdings.find((v) => v.ticker === h.ticker);
      const region = h.region ?? inferRegionFromTicker(h.ticker) ?? "other";
      return {
        key: region,
        label: REGION_LABELS[region] ?? region,
        krw: hv?.valueKrw ?? 0,
      };
    });
  l2Entries.push({ key: "cash", label: "현금", krw: valuation.cashKrw });

  const sectorRows = computeSectorWeights(valuation, snapshot);
  const l3Items: LayerItem[] = sectorRows.map((s) => ({
    key: s.sector,
    label: s.label,
    weightPct: s.weightPct,
  }));

  const l4Items: LayerItem[] = Object.entries(weights)
    .filter(([t]) => t !== "CASH")
    .map(([ticker, weightPct]) => {
      const snap = snapshot.holdings.find((h) => h.ticker === ticker);
      const sector = resolveHoldingSector(ticker, snap?.sector);
      const sectorLabel =
        sector === "other"
          ? "기타"
          : (AGENT_SECTOR_LABELS[sector as AgentSectorId] ?? sector);
      return {
        key: ticker,
        label: ticker,
        weightPct,
        note: sectorLabel,
      };
    })
    .toSorted((a, b) => b.weightPct - a.weightPct);

  const topSector = l3Items[0];
  const topHolding = l4Items[0];
  const withReturn = valuation.holdings
    .filter((h) => h.returnPct != null)
    .toSorted((a, b) => (b.returnPct ?? 0) - (a.returnPct ?? 0));
  const best = withReturn[0];
  const worst = withReturn[withReturn.length - 1];

  let l4Insight = topHolding
    ? `${topHolding.label} ${topHolding.weightPct}% — 과대 시 분할 매도, 유입 섹터는 분할 매수로 연결합니다.`
    : "보유 종목이 없습니다.";

  if (best && worst) {
    l4Insight += ` 수익률 ${best.ticker} ${formatReturnPct(best.returnPct!)}`;
    if (withReturn.length > 1 && worst.ticker !== best.ticker) {
      l4Insight += ` · ${worst.ticker} ${formatReturnPct(worst.returnPct!)}`;
    }
    l4Insight += " — 손익 구간에 따라 추가 매수·차익실현·관찰이 달라집니다.";
  } else if (
    snapshot.holdings.some(
      (h) => h.avgCost == null || !Number.isFinite(h.avgCost) || h.avgCost <= 0
    )
  ) {
    l4Insight += " 매수가 미입력 종목은 수익률 기반 가이드에서 제외됩니다.";
  }

  return {
    intro: topSector && topHolding
      ? `${topSector.label} ${topSector.weightPct}% · 최대 보유 ${topHolding.label} ${topHolding.weightPct}% — L0~L4 계층별 비중 분석`
      : "L0~L4 계층별 포트폴리오 비중 분석",
    layers: [
      {
        layer: "L0",
        title: ANALYSIS_LAYERS[0].title,
        role: ANALYSIS_LAYERS[0].role,
        items: l0Items.length ? l0Items : [{ key: "CASH", label: "현금", weightPct: weights.CASH ?? 0 }],
        insight:
          (weights.CASH ?? 0) < 5
            ? "현금 비중 5% 미만 — 환전·매도로 재원 확보 필요 (Follow·선점 실행 전)."
            : "통화별 현금 여유가 있어 분할 매수 재원 조달이 가능합니다.",
      },
      {
        layer: "L1",
        title: ANALYSIS_LAYERS[1].title,
        role: ANALYSIS_LAYERS[1].role,
        items: aggregateByKey(l1Entries, total),
        insight: "자산군 분산을 확인한 뒤 섹터·종목 조정으로 L3·L4를 맞춥니다.",
      },
      {
        layer: "L2",
        title: ANALYSIS_LAYERS[2].title,
        role: ANALYSIS_LAYERS[2].role,
        items: aggregateByKey(l2Entries, total),
        insight: "지역 rotation과 환율 노출을 함께 봅니다.",
      },
      {
        layer: "L3",
        title: ANALYSIS_LAYERS[3].title,
        role: ANALYSIS_LAYERS[3].role,
        items: l3Items,
        insight: topSector
          ? `보유 섹터 중 ${topSector.label} ${topSector.weightPct}% — 크로스 섹터 유입·유출과 대조하세요.`
          : "섹터 태그가 없으면 L3 분석이 제한됩니다.",
      },
      {
        layer: "L4",
        title: ANALYSIS_LAYERS[4].title,
        role: ANALYSIS_LAYERS[4].role,
        items: l4Items,
        insight: l4Insight,
      },
    ],
  };
}
