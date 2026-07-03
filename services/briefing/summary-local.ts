import type { HoldingsSnapshot } from "@/types/agent";
import type { HoldingValuation } from "@/lib/agent/valuation";
import {
  AGENT_SECTOR_LABELS,
  KNOWN_TICKER_CLASSIFICATIONS,
  SECTOR_FLOW_FIXTURE,
  type AgentSectorId,
} from "@/config/agent";
import { formatKrw } from "@/lib/agent/valuation";

export interface LocalBriefingSummary {
  date: string;
  lines: string[];
  sectorTop3: Array<{ sector: string; label: string; weightPct: number }>;
  disclaimer: string;
}

function sectorWeight(
  snapshot: HoldingsSnapshot,
  totalKrw: number,
  holdingValues?: HoldingValuation[]
): Map<AgentSectorId, number> {
  const weights = new Map<AgentSectorId, number>();
  if (totalKrw <= 0) return weights;

  const valueByTicker = new Map(
    (holdingValues ?? []).map((h) => [h.ticker.toUpperCase(), h.valueKrw])
  );

  for (const h of snapshot.holdings) {
    const known = KNOWN_TICKER_CLASSIFICATIONS[h.ticker];
    const sector = (h.sector ?? known?.sector) as AgentSectorId | undefined;
    if (!sector) continue;
    const value =
      valueByTicker.get(h.ticker.toUpperCase()) ??
      totalKrw / Math.max(snapshot.holdings.length, 1);
    weights.set(sector, (weights.get(sector) ?? 0) + value);
  }
  return weights;
}

/** LLM 없이 보유·섹터 fixture로 30초 스캔 요약 생성 */
export function buildLocalBriefingSummary(
  snapshot: HoldingsSnapshot,
  totalKrw: number,
  holdingValues?: HoldingValuation[]
): LocalBriefingSummary {
  const date = new Date().toISOString().slice(0, 10);
  const weights = sectorWeight(snapshot, totalKrw, holdingValues);
  const sectorTop3 = [...weights.entries()]
    .toSorted((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([sector, w]) => ({
      sector,
      label: AGENT_SECTOR_LABELS[sector] ?? sector,
      weightPct: totalKrw > 0 ? Math.round((w / totalKrw) * 100) : 0,
    }));

  const hotSector = SECTOR_FLOW_FIXTURE[0];
  const lines = [
    `총자산 ${formatKrw(totalKrw)} 기준으로 보유 ${snapshot.holdings.length}종목·현금 3통화를 반영했습니다.`,
    sectorTop3.length > 0
      ? `비중 상위 섹터: ${sectorTop3.map((s) => s.label).join(", ")}.`
      : "섹터 태그가 없는 종목이 있어 섹터 분석은 제한됩니다.",
    `시장 섹터 흐름은 참고 데이터로 제공됩니다. ${hotSector.label} 섹터 수급 점수 ${hotSector.flowScore.toFixed(2)} — 상세 브리핑은 추후 제공.`,
    "환전·리밸런싱은 환율 변동과 수수료를 감안해 검토하세요. (참고용)",
  ];

  return {
    date,
    lines,
    sectorTop3,
    disclaimer:
      "예상 수익률·제안은 참고용이며 투자 권유가 아닙니다. 시장 데이터·섹터 흐름은 일부 fixture입니다.",
  };
}
