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

function applyDemoSeedPrices(
  prices: Record<string, number | null | undefined>,
  tickers: string[]
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const t of tickers) {
    const key = t.toUpperCase();
    const live = prices[key];
    if (live != null && Number.isFinite(live)) {
      out[key] = live;
    } else {
      const seed = DEMO_MARKET_SEED.prices[key as keyof typeof DEMO_MARKET_SEED.prices];
      if (seed != null) out[key] = seed;
    }
  }
  return out;
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
    usdKrw: fxRaw.usdKrw,
    jpyKrw: fxRaw.jpyKrw,
  };
  let priceSource: PriceSource = "yahoo";

  if ((!fx.usdKrw || !fx.jpyKrw) && allowDemo) {
    fx = { ...DEMO_MARKET_SEED.fx };
    priceSource = "demo-seed";
  } else if (!fx.usdKrw || !fx.jpyKrw) {
    return null;
  }

  const yahooPrices = await fetchPricesFromYahoo(tickers);
  let prices: Record<string, number>;

  const allYahooOk = tickers.every((t) => {
    const p = yahooPrices[t.toUpperCase()];
    return p != null && Number.isFinite(p);
  });

  if (allYahooOk) {
    prices = applyDemoSeedPrices(yahooPrices, tickers);
  } else if (allowDemo) {
    prices = applyDemoSeedPrices(yahooPrices, tickers);
    priceSource = allYahooOk ? "yahoo" : priceSource === "demo-seed" ? "demo-seed" : "yahoo-partial";
    if (tickers.some((t) => prices[t.toUpperCase()] == null)) {
      return null;
    }
  } else {
    return null;
  }

  const valuation = computeValuation(snapshot, prices, {
    usdKrw: fx.usdKrw!,
    jpyKrw: fx.jpyKrw!,
  });

  if (valuation.holdings.length === 0 && snapshot.holdings.length > 0 && !allowDemo) {
    return null;
  }

  return { valuation, priceSource };
}
