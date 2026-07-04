import type { Currency } from "@/types/agent";
import { FX_SPREAD_PCT } from "@/config/agent";
import type { FxRates } from "@/lib/agent/valuation";

function applyFxSpread(rate: number): number {
  return rate * (1 + FX_SPREAD_PCT / 100);
}

/** KRW 평가액을 결제 통화 금액으로 환산 (valuation.convertToKrw의 역함수) */
export function nativeAmountFromKrw(
  valueKrw: number,
  currency: Currency,
  fx: FxRates
): number {
  if (currency === "KRW") return valueKrw;
  if (currency === "USD") return valueKrw / applyFxSpread(fx.usdKrw);
  return valueKrw / applyFxSpread(fx.jpyKrw);
}

/** 평가액·수익률로 매수원가(KRW) 역산 */
export function deriveCostKrwFromReturn(valueKrw: number, returnPct: number): number {
  if (!Number.isFinite(valueKrw) || valueKrw <= 0) return NaN;
  if (!Number.isFinite(returnPct)) return NaN;
  const factor = 1 + returnPct / 100;
  if (factor <= 0) return NaN;
  return valueKrw / factor;
}

/** 평가액·수익률·수량으로 1주당 매수가(결제 통화) 역산 */
export function deriveAvgCostFromPaste(input: {
  valueKrw: number;
  returnPct: number;
  quantity: number;
  currency: Currency;
  fx: FxRates;
}): number | undefined {
  const costKrw = deriveCostKrwFromReturn(input.valueKrw, input.returnPct);
  if (!Number.isFinite(costKrw) || costKrw <= 0) return undefined;
  if (!Number.isFinite(input.quantity) || input.quantity <= 0) return undefined;

  const costNative = nativeAmountFromKrw(costKrw, input.currency, input.fx);
  const avgCost = costNative / input.quantity;
  if (!Number.isFinite(avgCost) || avgCost <= 0) return undefined;
  return avgCost;
}

/** 평가액·수익률로 손익금(KRW) 역산 */
export function derivePnlKrwFromReturn(valueKrw: number, returnPct: number): number | undefined {
  const costKrw = deriveCostKrwFromReturn(valueKrw, returnPct);
  if (!Number.isFinite(costKrw)) return undefined;
  return valueKrw - costKrw;
}
