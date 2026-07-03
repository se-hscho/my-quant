import type { Region } from "@/types/agent";

export const AGENT_SECTORS = [
  { id: "semiconductor", label: "반도체" },
  { id: "technology", label: "기술" },
  { id: "healthcare", label: "헬스케어" },
  { id: "financials", label: "금융" },
  { id: "energy", label: "에너지" },
  { id: "consumer", label: "소비재" },
  { id: "industrial", label: "산업재" },
  { id: "materials", label: "소재" },
  { id: "utilities", label: "유틸리티" },
  { id: "real_estate", label: "부동산" },
  { id: "gold", label: "금·원자재" },
  { id: "bonds", label: "채권" },
] as const;

export type AgentSectorId = (typeof AGENT_SECTORS)[number]["id"];

export const AGENT_SECTOR_LABELS: Record<AgentSectorId, string> = Object.fromEntries(
  AGENT_SECTORS.map((s) => [s.id, s.label])
) as Record<AgentSectorId, string>;

export const KNOWN_TICKER_CLASSIFICATIONS: Record<
  string,
  { sector: AgentSectorId; region: Region }
> = {
  SOXX: { sector: "semiconductor", region: "US" },
  SMH: { sector: "semiconductor", region: "US" },
  QQQ: { sector: "technology", region: "US" },
  AAPL: { sector: "technology", region: "US" },
  MSFT: { sector: "technology", region: "US" },
  "005930.KS": { sector: "semiconductor", region: "KR" },
  "000660.KS": { sector: "semiconductor", region: "KR" },
  GLD: { sector: "gold", region: "US" },
  TLT: { sector: "bonds", region: "US" },
};
