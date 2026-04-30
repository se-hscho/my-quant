export interface Stock {
  ticker: string;
  name: string;
  description: string;
}

export type BundleCategory = "테마형" | "팩터형" | "전통 배분" | "기관 따라하기";

export interface Bundle {
  id: string;
  name: string;
  category: BundleCategory;
  description: string;
  stocks: Stock[];
}

export type OptimizationMethod = "max-sharpe" | "min-variance" | "risk-parity";

export interface PriceCache {
  ticker: string;
  range: string;
  dates: string[];
  closes: number[];
  cachedAt: number;
}

export interface PortfolioPoint {
  weights?: Record<string, number>;
  expectedReturn: number;
  volatility: number;
  sharpe: number;
}

export interface PortfolioMetrics {
  annualReturn: number;
  volatility: number;
  sharpe: number;
  mdd: number;
}

export interface PortfolioResult {
  id: string;
  bundleId: string;
  bundleName: string;
  method: OptimizationMethod;
  tickers: string[];
  weights: Record<string, number>;
  metrics: PortfolioMetrics;
  frontier: PortfolioPoint[];
  savedAt: string;
}
