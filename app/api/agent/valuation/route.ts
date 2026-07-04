import { NextResponse } from "next/server";
import type { HoldingsSnapshot } from "@/types/agent";
import { DEMO_MARKET_SEED } from "@/lib/agent/market-data";
import {
  fetchFxRatesFromYahoo,
  fetchYahooLatestClose,
  fetchYahooPriceTrend,
} from "@/lib/agent/yahoo-quote";
import { computeValuation } from "@/lib/agent/valuation";
import { computePortfolioWeights, resolveHoldingSector } from "@/lib/agent/weights";
import { AGENT_SECTOR_LABELS, type AgentSectorId } from "@/config/agent";
import {
  classifyMomentumTrend,
  suggestWeightAction,
} from "@/lib/agent/momentum-trend";
import { getSmartMoneyData } from "@/services/smart-money/adapter";

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
  const fx = {
    usdKrw: fxRaw.usdKrw ?? DEMO_MARKET_SEED.fx.usdKrw,
    jpyKrw: fxRaw.jpyKrw ?? DEMO_MARKET_SEED.fx.jpyKrw,
  };

  const tickers = [...new Set(snapshot.holdings.map((h) => h.ticker.toUpperCase()))];
  const smartMoney = await getSmartMoneyData();
  const flowBySector = Object.fromEntries(
    smartMoney.sectorFlows.map((f) => [f.sector, f.flowScore])
  );

  const priceEntries = await Promise.all(
    tickers.map(async (ticker) => {
      const live = await fetchYahooLatestClose(ticker);
      if (live != null) return [ticker, live] as const;
      const avgCost = snapshot.holdings.find(
        (h) => h.ticker.toUpperCase() === ticker
      )?.avgCost;
      return [ticker, avgCost ?? null] as const;
    })
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
    const snap = snapshot.holdings.find((s) => s.id === h.id || s.ticker === h.ticker);
    const sector = resolveHoldingSector(h.ticker, snap?.sector);
    const sectorFlow = flowBySector[sector];
    const weightPct = weights[h.ticker.toUpperCase()] ?? weights[h.ticker];
    const priceTrend = trendsById[h.id] ?? undefined;
    const momentum = priceTrend ? classifyMomentumTrend(priceTrend, sectorFlow) : undefined;
    const weightHint =
      momentum != null
        ? suggestWeightAction({
            returnPct: h.returnPct,
            weightPct,
            momentum,
            sectorLabel:
              sector === "other"
                ? "기타"
                : (AGENT_SECTOR_LABELS[sector as AgentSectorId] ?? sector),
            sectorFlowScore: sectorFlow,
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
