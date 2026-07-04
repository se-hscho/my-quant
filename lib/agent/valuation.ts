import type { Currency, HoldingsSnapshot } from "@/types/agent";
import { FX_SPREAD_PCT } from "@/config/agent";

export interface FxRates {
  usdKrw: number;
  jpyKrw: number;
}

export interface HoldingValuation {
  ticker: string;
  quantity: number;
  currency: Currency;
  price: number;
  valueNative: number;
  valueKrw: number;
}

export interface ValuationResult {
  totalKrw: number;
  cashKrw: number;
  holdingsKrw: number;
  holdings: HoldingValuation[];
  fx: FxRates;
  warnings: string[];
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

export function computeValuation(
  snapshot: HoldingsSnapshot,
  prices: Record<string, number | null | undefined>,
  fx: FxRates
): ValuationResult {
  const warnings: string[] = [];
  const holdings: HoldingValuation[] = [];
  let holdingsKrw = 0;

  for (const h of snapshot.holdings) {
    const price = prices[h.ticker.toUpperCase()];
    if (price == null || !Number.isFinite(price)) {
      warnings.push(`${h.ticker} 시세를 가져오지 못했습니다`);
      continue;
    }
    const valueNative = h.quantity * price;
    const valueKrw = convertToKrw(valueNative, h.currency, fx);
    holdingsKrw += valueKrw;
    holdings.push({
      ticker: h.ticker,
      quantity: h.quantity,
      currency: h.currency,
      price,
      valueNative,
      valueKrw,
    });
  }

  const cashKrw =
    snapshot.cash.krw +
    convertToKrw(snapshot.cash.usd, "USD", fx) +
    convertToKrw(snapshot.cash.jpy, "JPY", fx);

  return {
    totalKrw: cashKrw + holdingsKrw,
    cashKrw,
    holdingsKrw,
    holdings,
    fx,
    warnings,
  };
}

export function formatKrw(amount: number): string {
  return `₩${Math.round(amount).toLocaleString("ko-KR")}`;
}
