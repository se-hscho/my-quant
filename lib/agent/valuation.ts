import type { Currency, HoldingsSnapshot } from "@/types/agent";
import { FX_SPREAD_PCT } from "@/config/agent";
import type { PriceTrendPct } from "@/lib/agent/price-trends";
import type { MomentumInsight } from "@/lib/agent/momentum-trend";

export interface FxRates {
  usdKrw: number;
  jpyKrw: number;
}

export interface HoldingValuation {
  id: string;
  ticker: string;
  quantity: number;
  currency: Currency;
  price: number;
  valueNative: number;
  valueKrw: number;
  avgCost?: number;
  costNative?: number;
  costKrw?: number;
  pnlKrw?: number;
  returnPct?: number;
  weightPct?: number;
  priceTrend?: PriceTrendPct;
  momentum?: MomentumInsight;
  weightHint?: string;
}

export interface ValuationResult {
  totalKrw: number;
  cashKrw: number;
  holdingsKrw: number;
  holdings: HoldingValuation[];
  fx: FxRates;
  warnings: string[];
  /** 매수가가 입력된 종목만 집계 */
  holdingsCostKrw?: number;
  holdingsPnlKrw?: number;
  holdingsReturnPct?: number;
  holdingsWithCostCount?: number;
}

function applyFxSpread(rate: number): number {
  return rate * (1 + FX_SPREAD_PCT / 100);
}

export function convertToKrw(
  amount: number,
  currency: Currency,
  fx: FxRates
): number {
  if (currency === "KRW") return amount;
  if (currency === "USD") return amount * applyFxSpread(fx.usdKrw);
  return amount * applyFxSpread(fx.jpyKrw);
}

function costMetrics(
  quantity: number,
  avgCost: number | undefined,
  valueNative: number,
  valueKrw: number,
  currency: Currency,
  fx: FxRates
): Pick<
  HoldingValuation,
  "avgCost" | "costNative" | "costKrw" | "pnlKrw" | "returnPct"
> {
  if (avgCost == null || !Number.isFinite(avgCost) || avgCost <= 0) {
    return {};
  }

  const costNative = quantity * avgCost;
  const costKrw = convertToKrw(costNative, currency, fx);
  const pnlKrw = valueKrw - costKrw;
  const returnPct =
    costNative > 0 ? ((valueNative - costNative) / costNative) * 100 : 0;

  return {
    avgCost,
    costNative,
    costKrw,
    pnlKrw,
    returnPct,
  };
}

export function computeValuation(
  snapshot: HoldingsSnapshot,
  prices: Record<string, number | null | undefined>,
  fx: FxRates
): ValuationResult {
  const warnings: string[] = [];
  const holdings: HoldingValuation[] = [];
  let holdingsKrw = 0;
  let holdingsCostKrw = 0;
  let holdingsWithCostCount = 0;

  for (const h of snapshot.holdings) {
    const price = prices[h.ticker.toUpperCase()];
    if (price == null || !Number.isFinite(price)) {
      warnings.push(`${h.ticker} 시세를 가져오지 못했습니다`);
      continue;
    }
    const valueNative = h.quantity * price;
    const valueKrw = convertToKrw(valueNative, h.currency, fx);
    holdingsKrw += valueKrw;

    const costs = costMetrics(
      h.quantity,
      h.avgCost,
      valueNative,
      valueKrw,
      h.currency,
      fx
    );
    if (costs.costKrw != null) {
      holdingsCostKrw += costs.costKrw;
      holdingsWithCostCount += 1;
    }

    holdings.push({
      id: h.id,
      ticker: h.ticker,
      quantity: h.quantity,
      currency: h.currency,
      price,
      valueNative,
      valueKrw,
      ...costs,
    });
  }

  const cashKrw =
    snapshot.cash.krw +
    convertToKrw(snapshot.cash.usd, "USD", fx) +
    convertToKrw(snapshot.cash.jpy, "JPY", fx);

  const holdingsPnlKrw =
    holdingsWithCostCount > 0 ? holdingsKrw - holdingsCostKrw : undefined;
  const holdingsReturnPct =
    holdingsCostKrw != null &&
    holdingsCostKrw > 0 &&
    holdingsWithCostCount > 0
      ? ((holdingsKrw - holdingsCostKrw) / holdingsCostKrw) * 100
      : undefined;

  if (
    snapshot.holdings.some(
      (h) => h.avgCost == null || !Number.isFinite(h.avgCost) || h.avgCost <= 0
    )
  ) {
    warnings.push("매수가 미입력 종목은 수익률에서 제외됩니다");
  }

  return {
    totalKrw: cashKrw + holdingsKrw,
    cashKrw,
    holdingsKrw,
    holdings,
    fx,
    warnings,
    holdingsCostKrw:
      holdingsWithCostCount > 0 ? holdingsCostKrw : undefined,
    holdingsPnlKrw,
    holdingsReturnPct,
    holdingsWithCostCount:
      holdingsWithCostCount > 0 ? holdingsWithCostCount : undefined,
  };
}

export function formatKrw(amount: number): string {
  return `₩${Math.round(amount).toLocaleString("ko-KR")}`;
}
