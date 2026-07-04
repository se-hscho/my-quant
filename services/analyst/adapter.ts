import type { AnalystRow } from "@/services/briefing/types";
import seed from "@/data/analyst-seed.json";
import "server-only";
import { fetchFinnhubRecommendations } from "./finnhub";
import { fetchKrWisereportReports } from "./kr-wisereport";

function normalizeTicker(t: string): string {
  return t.trim().toUpperCase();
}

function rowKey(r: AnalystRow): string {
  return `${normalizeTicker(r.ticker)}|${r.broker}|${r.date}`;
}

function filterSeed(tickers: string[]): AnalystRow[] {
  const upper = new Set(tickers.map(normalizeTicker));
  return (seed as AnalystRow[]).filter(
    (r) =>
      upper.has(normalizeTicker(r.ticker)) &&
      r.broker &&
      r.date &&
      r.rating
  );
}

function mergeReports(layers: AnalystRow[][]): AnalystRow[] {
  const byKey = new Map<string, AnalystRow>();
  for (const layer of layers) {
    for (const row of layer) {
      byKey.set(rowKey(row), row);
    }
  }
  return [...byKey.values()].toSorted(
    (a, b) => b.date.localeCompare(a.date) || a.broker.localeCompare(b.broker)
  );
}

/** Wisereport(KR) + Finnhub(US) + seed — live 우선 병합 */
export async function getAnalystReports(
  tickers: string[]
): Promise<AnalystRow[]> {
  if (tickers.length === 0) return [];

  const [krLive, usLive, seedRows] = await Promise.all([
    fetchKrWisereportReports(tickers),
    fetchFinnhubRecommendations(tickers),
    Promise.resolve(filterSeed(tickers)),
  ]);

  return mergeReports([seedRows, usLive, krLive]);
}

export { getAnalystFallbackRationale } from "./fallback-rationale";
