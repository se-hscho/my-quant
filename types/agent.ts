export type AssetType = "stock" | "etf" | "bond_etf" | "gold_etf";
export type Currency = "KRW" | "USD" | "JPY";
export type Region = "KR" | "US" | "JP";

export interface Holding {
  id: string;
  ticker: string;
  quantity: number;
  /** 1주당 매수가 — 결제 통화(currency) 기준. 없으면 수익률 미표시 */
  avgCost?: number;
  assetType: AssetType;
  currency: Currency;
  sector?: string;
  region?: Region;
}

export interface CashBalances {
  krw: number;
  usd: number;
  jpy: number;
}

export interface HoldingsSnapshot {
  holdings: Holding[];
  cash: CashBalances;
  updatedAt: string;
}
