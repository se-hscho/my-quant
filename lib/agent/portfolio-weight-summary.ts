import { AGENT_SECTOR_LABELS, type AgentSectorId } from "@/config/agent";
import type { HoldingsSnapshot } from "@/types/agent";
import type { ValuationResult } from "@/lib/agent/valuation";
import { computeSectorWeights, resolveHoldingSector, roundWeight } from "@/lib/agent/weights";
import type { BrokeragePasteRow } from "@/services/agent/brokerage-paste-llm";
import { buildScenarios } from "@/services/briefing/scenarios";
import { formatScenarioReference } from "@/config/agent-scenarios";

export interface SectorWeightComparisonRow {
  sector: string;
  label: string;
  currentPct: number;
  recommendedPct: number;
  deltaPp: number;
}

export function buildValuationFromPasteRows(rows: BrokeragePasteRow[]): ValuationResult {
  const holdings = rows.map((r, i) => ({
    id: `paste-${i}`,
    ticker: r.ticker,
    quantity: r.quantity,
    currency: r.currency,
    price: r.valueKrw,
    valueNative: r.valueKrw,
    valueKrw: r.valueKrw,
    returnPct: r.returnPct,
  }));

  const totalKrw = holdings.reduce((sum, h) => sum + h.valueKrw, 0);

  return {
    totalKrw,
    cashKrw: 0,
    holdingsKrw: totalKrw,
    holdings,
    fx: { usdKrw: 1350, jpyKrw: 9.2 },
    warnings: ["paste_valuation"],
  };
}

export function aggregateTickerWeightsToSectors(
  tickerWeights: Record<string, number>,
  snapshot: HoldingsSnapshot
): Record<string, number> {
  const bySector: Record<string, number> = { CASH: tickerWeights.CASH ?? 0 };

  for (const [ticker, pct] of Object.entries(tickerWeights)) {
    if (ticker === "CASH") continue;
    const holding = snapshot.holdings.find(
      (h) => h.ticker.toUpperCase() === ticker.toUpperCase()
    );
    const sector = resolveHoldingSector(ticker, holding?.sector);
    bySector[sector] = roundWeight((bySector[sector] ?? 0) + pct);
  }

  return bySector;
}

export function buildSectorWeightComparison(input: {
  snapshot: HoldingsSnapshot;
  valuation: ValuationResult;
}): SectorWeightComparisonRow[] {
  const currentRows = computeSectorWeights(input.valuation, input.snapshot);
  const currentBySector = Object.fromEntries(currentRows.map((r) => [r.sector, r.weightPct]));

  const scenarios = buildScenarios(input.snapshot, input.valuation);

  const follow = scenarios.find((s) => s.id === 1);
  const recommendedBySector = follow
    ? aggregateTickerWeightsToSectors(follow.weightsAfter, input.snapshot)
    : {};

  const sectors = new Set([
    ...Object.keys(currentBySector),
    ...Object.keys(recommendedBySector),
  ]);

  return [...sectors]
    .filter((s) => s !== "CASH")
    .map((sector) => {
      const label =
        sector === "other"
          ? "기타"
          : (AGENT_SECTOR_LABELS[sector as AgentSectorId] ?? sector);
      const currentPct = currentBySector[sector] ?? 0;
      const recommendedPct = recommendedBySector[sector] ?? currentPct;
      return {
        sector,
        label,
        currentPct,
        recommendedPct,
        deltaPp: roundWeight(recommendedPct - currentPct),
      };
    })
    .toSorted((a, b) => b.currentPct - a.currentPct);
}

export function formatBrokeragePasteSummary(input: {
  rows: BrokeragePasteRow[];
  comparison: SectorWeightComparisonRow[];
  totalKrw: number;
  confidence: "high" | "low";
}): string {
  const lines: string[] = [];
  lines.push(`📊 **자산 현황** (평가 합계 ${Math.round(input.totalKrw).toLocaleString("ko-KR")}원)`);
  lines.push("");

  lines.push("| 섹터 | 현재 | 추천(1안) | Δ |");
  lines.push("| --- | ---: | ---: | ---: |");
  for (const row of input.comparison) {
    const delta =
      row.deltaPp > 0 ? `+${row.deltaPp}` : row.deltaPp === 0 ? "0" : `${row.deltaPp}`;
    lines.push(
      `| ${row.label} | ${row.currentPct}% | ${row.recommendedPct}% | ${delta}%p |`
    );
  }

  lines.push("");
  lines.push("**주요 종목**");
  for (const r of input.rows.slice(0, 12)) {
    const ret =
      r.returnPct != null
        ? ` · ${r.returnPct > 0 ? "+" : ""}${r.returnPct.toFixed(2)}%`
        : "";
    lines.push(
      `· ${r.name} (${r.ticker}) ${Math.round(r.valueKrw).toLocaleString("ko-KR")}원${ret}`
    );
  }
  if (input.rows.length > 12) {
    lines.push(`· … 외 ${input.rows.length - 12}개`);
  }

  lines.push("");
  lines.push(
    `${formatScenarioReference(1)} 비중은 참고용 시나리오입니다. 아래 종목을 보유에 반영했습니다.`
  );
  if (input.confidence === "low") {
    lines.push("인식 신뢰도가 낮습니다 — /agent/holdings에서 티커·수량을 확인해 주세요.");
  }
  lines.push("(참고용·투자 권유 아님)");

  return lines.join("\n");
}
