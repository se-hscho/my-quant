import type { AnalystRow } from "@/services/briefing/types";
import seed from "@/data/analyst-seed.json";

export function getAnalystReports(tickers: string[]): AnalystRow[] {
  const upper = new Set(tickers.map((t) => t.toUpperCase()));
  return (seed as AnalystRow[]).filter(
    (r) =>
      upper.has(r.ticker.toUpperCase()) &&
      r.broker &&
      r.date &&
      r.rating
  );
}

export function getAnalystFallbackRationale(ticker: string): string {
  return `${ticker}에 대한 공개 애널 요약이 없어 수급·가격 모멘텀 fixture를 근거로 구성했습니다.`;
}
