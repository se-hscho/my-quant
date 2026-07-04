import type { ValuationResult } from "@/lib/agent/valuation";
import type { PriceTrendPct } from "@/lib/agent/price-trends";

export interface PortfolioPeriodReturns {
  d1: number;
  d7: number;
  m1: number;
}

function weightedAvg(
  items: Array<{ weight: number; value: number | null | undefined }>
): number {
  let sum = 0;
  let wSum = 0;
  for (const { weight, value } of items) {
    if (value == null || !Number.isFinite(value)) continue;
    sum += weight * value;
    wSum += weight;
  }
  return wSum > 0 ? sum / wSum : 0;
}

/** 보유 종목 가격 추세를 KRW 비중 가중 평균 */
export function computeWeightedPortfolioReturns(input: {
  valuation: ValuationResult;
  trendsByTicker: Record<string, PriceTrendPct | null | undefined>;
}): PortfolioPeriodReturns {
  const items = input.valuation.holdings.map((h) => ({
    weight: h.valueKrw,
    trend: input.trendsByTicker[h.ticker.toUpperCase()] ?? input.trendsByTicker[h.ticker],
  }));

  return {
    d1: weightedAvg(items.map((i) => ({ weight: i.weight, value: i.trend?.d1 }))),
    d7: weightedAvg(items.map((i) => ({ weight: i.weight, value: i.trend?.d7 }))),
    m1: weightedAvg(items.map((i) => ({ weight: i.weight, value: i.trend?.m1 }))),
  };
}
