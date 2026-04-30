export interface Stock {
  ticker: string;
  name: string;
  description: string;
}

export interface Bundle {
  id: string;
  name: string;
  category: string;
  description: string;
  stocks: Stock[];
  isCustom?: boolean;
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
