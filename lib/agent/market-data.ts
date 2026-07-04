import type { HoldingsSnapshot } from "@/types/agent";
import { computeValuation, type ValuationResult } from "@/lib/agent/valuation";
import { fetchFxRatesFromYahoo, fetchYahooLatestClose } from "@/lib/agent/yahoo-quote";
import { isDemoPortfolioSnapshot } from "@/lib/agent/demo-portfolio";

/** Yahoo 실패 시 데모용 참고 시세 (KRW/USD, 일봉 근사) */
export const DEMO_MARKET_SEED = {
  fx: { usdKrw: 1380, jpyKrw: 9.2 },
  prices: {
    "005930.KS": 75_000,
    SOXX: 245,
    "069500.KS": 42_500,
  } as Record<string, number>,
} as const;

export type PriceSource = "yahoo" | "demo-seed" | "yahoo-partial";

export interface ResolvedValuation {
  valuation: ValuationResult;
  priceSource: PriceSource;
}

async function fetchPricesFromYahoo(
  tickers: string[]
): Promise<Record<string, number | null>> {
  return Object.fromEntries(
    await Promise.all(
      tickers.map(async (t) => [t.toUpperCase(), await fetchYahooLatestClose(t)] as const)
    )
  );
}

function avgCostFallbackPrice(
  snapshot: HoldingsSnapshot,
  ticker: string
): number | undefined {
  const h = snapshot.holdings.find(
    (x) => x.ticker.toUpperCase() === ticker.toUpperCase()
  );
  if (h?.avgCost != null && h.avgCost > 0) return h.avgCost;
  return undefined;
}

function applyPriceFallbacks(
  snapshot: HoldingsSnapshot,
  yahooPrices: Record<string, number | null | undefined>,
  tickers: string[],
  allowDemo: boolean
): { prices: Record<string, number>; usedFallback: boolean } {
  const out: Record<string, number> = {};
  let usedFallback = false;

  for (const t of tickers) {
    const key = t.toUpperCase();
    const live = yahooPrices[key];
    if (live != null && Number.isFinite(live)) {
      out[key] = live;
      continue;
    }

    const avgCost = avgCostFallbackPrice(snapshot, key);
    if (avgCost != null) {
      out[key] = avgCost;
      usedFallback = true;
      continue;
    }

    if (allowDemo) {
      const seed = DEMO_MARKET_SEED.prices[key as keyof typeof DEMO_MARKET_SEED.prices];
      if (seed != null) {
        out[key] = seed;
        usedFallback = true;
      }
    }
  }

  return { prices: out, usedFallback };
}

export async function resolveValuation(
  snapshot: HoldingsSnapshot,
  options: { allowDemoFallback?: boolean } = {}
): Promise<ResolvedValuation | null> {
  const tickers = [...new Set(snapshot.holdings.map((h) => h.ticker.toUpperCase()))];
  const allowDemo =
    options.allowDemoFallback === true || isDemoPortfolioSnapshot(snapshot);

  const fxRaw = await fetchFxRatesFromYahoo();
  let fx = {
    usdKrw: fxRaw.usdKrw ?? DEMO_MARKET_SEED.fx.usdKrw,
    jpyKrw: fxRaw.jpyKrw ?? DEMO_MARKET_SEED.fx.jpyKrw,
  };

  let priceSource: PriceSource = "yahoo";
  if (!fxRaw.usdKrw || !fxRaw.jpyKrw) {
    priceSource = "yahoo-partial";
  }

  const yahooPrices = await fetchPricesFromYahoo(tickers);
  const { prices, usedFallback } = applyPriceFallbacks(
    snapshot,
    yahooPrices,
    tickers,
    allowDemo
  );

  if (usedFallback && priceSource === "yahoo") {
    priceSource = "yahoo-partial";
  }
  if (allowDemo && !fxRaw.usdKrw && !fxRaw.jpyKrw) {
    priceSource = "demo-seed";
  }

  const missing = tickers.filter((t) => prices[t.toUpperCase()] == null);
  if (missing.length > 0 && !allowDemo) {
    // 현금만 있거나 일부 종목만 누락이면 부분 평가 허용
    if (tickers.length === missing.length && snapshot.cash.krw + snapshot.cash.usd + snapshot.cash.jpy === 0) {
      return null;
    }
  }

  const valuation = computeValuation(snapshot, prices, fx);

  if (valuation.holdings.length === 0 && snapshot.holdings.length > 0) {
    if (snapshot.cash.krw + snapshot.cash.usd + snapshot.cash.jpy > 0) {
      return { valuation, priceSource };
    }
    return allowDemo ? { valuation, priceSource } : null;
  }

  return { valuation, priceSource };
}
