import { NextResponse } from "next/server";
import type { HoldingsSnapshot } from "@/types/agent";
import { fetchFxRatesFromYahoo, fetchYahooLatestClose } from "@/lib/agent/yahoo-quote";
import { computeValuation } from "@/lib/agent/valuation";

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
  return NextResponse.json(result);
}
