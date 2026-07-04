import type { AssetType, Currency, HoldingsSnapshot } from "@/types/agent";

export const ASSET_TYPE_LABELS: Record<AssetType, string> = {
  stock: "주식",
  etf: "ETF",
  bond_etf: "채권ETF",
  gold_etf: "금ETF",
};

export const CURRENCY_LABELS: Record<Currency, string> = {
  KRW: "KRW",
  USD: "USD",
  JPY: "JPY",
};

export const TOTAL_ASSETS_PLACEHOLDER = "시세 로딩 중";

export function formatCashAmount(currency: Currency, amount: number): string {
  if (currency === "KRW") {
    return `₩${amount.toLocaleString("ko-KR")}`;
  }
  if (currency === "USD") {
    return `$${amount.toLocaleString("en-US")}`;
  }
  return `¥${amount.toLocaleString("ja-JP")}`;
}

export function parseNumericInput(value: string): number {
  const n = Number(value.replace(/,/g, "").trim());
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

export function formatPrice(currency: Currency, amount: number): string {
  if (currency === "KRW") {
    return `₩${Math.round(amount).toLocaleString("ko-KR")}`;
  }
  if (currency === "USD") {
    return `$${amount.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
  }
  return `¥${Math.round(amount).toLocaleString("ja-JP")}`;
}

export function formatReturnPct(pct: number): string {
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct.toFixed(2)}%`;
}

export function formatPnlKrw(pnl: number): string {
  const sign = pnl > 0 ? "+" : "";
  return `${sign}${Math.round(pnl).toLocaleString("ko-KR")}원`;
}

export function formatQuantity(quantity: number): string {
  return quantity.toLocaleString("ko-KR", { maximumFractionDigits: 4 });
}

export function snapshotSummary(snapshot: HoldingsSnapshot): string {
  const parts = [
    `KRW ${formatCashAmount("KRW", snapshot.cash.krw)}`,
    `USD ${formatCashAmount("USD", snapshot.cash.usd)}`,
    `JPY ${formatCashAmount("JPY", snapshot.cash.jpy)}`,
  ];
  return parts.join(" · ");
}
