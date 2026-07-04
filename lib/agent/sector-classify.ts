import type { Holding, Region } from "@/types/agent";
import {
  KNOWN_TICKER_CLASSIFICATIONS,
  type AgentSectorId,
} from "@/config/agent";

export interface TickerClassification {
  sector: AgentSectorId;
  region: Region;
}

export function normalizeTicker(ticker: string): string {
  return ticker.trim().toUpperCase();
}

export function inferRegionFromTicker(ticker: string): Region | null {
  const t = normalizeTicker(ticker);
  if (t.endsWith(".KS")) return "KR";
  if (t.endsWith(".T")) return "JP";
  return null;
}

export function classifyTicker(ticker: string): TickerClassification | null {
  const normalized = normalizeTicker(ticker);
  const known = KNOWN_TICKER_CLASSIFICATIONS[normalized];
  if (known) return known;
  return null;
}

export function holdingNeedsSectorTag(holding: Holding): boolean {
  return !holding.sector;
}

export function applySectorTag(
  holding: Holding,
  sector: AgentSectorId,
  region?: Region
): Holding {
  return {
    ...holding,
    sector,
    region: region ?? holding.region ?? inferRegionFromTicker(holding.ticker) ?? undefined,
  };
}

export function findHoldingsMissingSector(holdings: Holding[]): Holding[] {
  return holdings.filter(holdingNeedsSectorTag);
}
