import { NextResponse } from "next/server";
import type { HoldingsSnapshot } from "@/types/agent";
import {
  fetchFxRatesFromYahoo,
  fetchYahooLatestClose,
  fetchYahooPriceTrend,
} from "@/lib/agent/yahoo-quote";
import { computeValuation } from "@/lib/agent/valuation";
import { computePortfolioWeights } from "@/lib/agent/weights";
import {
  classifyMomentumTrend,
  suggestWeightAction,
} from "@/lib/agent/momentum-trend";

export async function POST(request: Request) {
  let snapshot: HoldingsSnapshot;

  try {
    const body = (await request.json()) as { snapshot?: HoldingsSnapshot };
    if (!body.snapshot?.holdings || !body.snapshot?.cash) {
      return NextResponse.json({ error: "snapshot required" }, { status: 400 });
    }
    snapshot = body.snapshot;
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  const fxRaw = await fetchFxRatesFromYahoo();
  if (!fxRaw.usdKrw || !fxRaw.jpyKrw) {
    return NextResponse.json({ error: "FX rates unavailable" }, { status: 502 });
  }

  const fx = { usdKrw: fxRaw.usdKrw, jpyKrw: fxRaw.jpyKrw };
  const tickers = [...new Set(snapshot.holdings.map((h) => h.ticker.toUpperCase()))];

  const priceEntries = await Promise.all(
    tickers.map(async (ticker) => [ticker, await fetchYahooLatestClose(ticker)] as const)
  );
  const prices = Object.fromEntries(priceEntries);

  const result = computeValuation(snapshot, prices, fx);
  const weights = computePortfolioWeights(result);

  const trendEntries = await Promise.all(
    result.holdings.map(async (h) => {
      const trend = await fetchYahooPriceTrend(h.ticker);
      return [h.id, trend] as const;
    })
  );
  const trendsById = Object.fromEntries(trendEntries);

  result.holdings = result.holdings.map((h) => {
    const weightPct = weights[h.ticker.toUpperCase()] ?? weights[h.ticker];
    const priceTrend = trendsById[h.id] ?? undefined;
    const momentum = priceTrend ? classifyMomentumTrend(priceTrend) : undefined;
    const weightHint =
      momentum != null
        ? suggestWeightAction({
            returnPct: h.returnPct,
            weightPct,
            momentum,
          })
        : undefined;

    return {
      ...h,
      weightPct,
      priceTrend: priceTrend ?? undefined,
      momentum,
      weightHint,
    };
  });

  return NextResponse.json(result);
}
