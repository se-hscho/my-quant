import type { AgentSectorId } from "./agent";
import { SECTOR_PROXY_TICKERS } from "./agent-analysis-guide";

export interface StarterAllocationLine {
  sector: AgentSectorId;
  weightPct: number;
  role: string;
}

/** Follow·선점·최소변경별 목표 배분 (% — 합계 100) */
export const DEPLOYMENT_TEMPLATES: Record<
  "follow" | "lead" | "minimal",
  { deployPct: number; lines: StarterAllocationLine[]; cashReservePct: number }
> = {
  follow: {
    deployPct: 80,
    cashReservePct: 20,
    lines: [
      { sector: "technology", weightPct: 28, role: "국내 대형주 코어" },
      { sector: "semiconductor", weightPct: 22, role: "유입 섹터 Follow" },
      { sector: "semiconductor", weightPct: 15, role: "글로벌 반도체 ETF" },
      { sector: "bonds", weightPct: 15, role: "변동성 완충" },
    ],
  },
  lead: {
    deployPct: 85,
    cashReservePct: 15,
    lines: [
      { sector: "semiconductor", weightPct: 30, role: "선점 — 국내 반도체" },
      { sector: "semiconductor", weightPct: 25, role: "선점 — SOXX" },
      { sector: "technology", weightPct: 20, role: "성장 ETF" },
      { sector: "bonds", weightPct: 10, role: "최소 방어" },
    ],
  },
  minimal: {
    deployPct: 25,
    cashReservePct: 75,
    lines: [
      { sector: "bonds", weightPct: 10, role: "방어 코어" },
      { sector: "technology", weightPct: 10, role: "시장 베타 소량" },
      { sector: "semiconductor", weightPct: 5, role: "유입 섹터 소량 체험" },
    ],
  },
};

export function resolveStarterTicker(
  sector: AgentSectorId,
  preferKr: boolean,
  indexInSector: number
): { ticker: string; label: string } {
  const proxy = SECTOR_PROXY_TICKERS[sector];
  if (!proxy) {
    return { ticker: "069500.KS", label: "KODEX 200" };
  }
  if (sector === "semiconductor" && indexInSector === 1) {
    return { ticker: proxy.us, label: "SOXX" };
  }
  if (preferKr && proxy.kr) {
    return {
      ticker: proxy.kr,
      label: proxy.label ?? proxy.kr,
    };
  }
  return { ticker: proxy.us, label: proxy.label ?? proxy.us };
}
