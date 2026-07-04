import {
  computePriceTrendFromCloses,
  type PriceTrendPct,
} from "@/lib/agent/price-trends";

interface YahooResult {
  timestamp: number[];
  indicators: {
    quote: Array<{ close: (number | null)[] }>;
    adjclose?: Array<{ adjclose: (number | null)[] }>;
  };
}

interface YahooChartResponse {
  chart: {
    result?: YahooResult[];
    error?: { description?: string } | null;
  };
}

/** Yahoo Finance 심볼 정규화 — 6자리 숫자만 있으면 KRX `.KS` 접미사 */
export function toYahooSymbol(ticker: string): string {
  const t = ticker.trim().toUpperCase();
  if (/^\d{6}$/.test(t)) return `${t}.KS`;
  return t;
}

export async function fetchYahooLatestClose(ticker: string): Promise<number | null> {
  const series = await fetchYahooCloseSeries(ticker, "5d");
  return series.length > 0 ? series[series.length - 1] : null;
}

/** 시간순 유효 종가 배열 (마지막=최신) */
export async function fetchYahooCloseSeries(
  ticker: string,
  range: "5d" | "3mo" = "5d"
): Promise<number[]> {
  const symbol = toYahooSymbol(ticker);
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
    symbol
  )}?interval=1d&range=${range}`;

  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; quant-portfolio/1.0)" },
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });

  if (!res.ok) return [];

  const data = (await res.json()) as YahooChartResponse;
  const result = data.chart.result?.[0];
  if (!result) return [];

  const adj = result.indicators.adjclose?.[0]?.adjclose;
  const raw = result.indicators.quote[0]?.close ?? [];
  const series = adj ?? raw;

  const closes: number[] = [];
  for (const v of series) {
    if (v != null && Number.isFinite(v)) closes.push(v);
  }
  return closes;
}

export async function fetchYahooPriceTrend(ticker: string): Promise<PriceTrendPct | null> {
  const closes = await fetchYahooCloseSeries(ticker, "3mo");
  if (closes.length < 2) return null;
  return computePriceTrendFromCloses(closes);
}

export async function fetchFxRatesFromYahoo(): Promise<{
  usdKrw: number | null;
  jpyKrw: number | null;
}> {
  const [usdKrw, jpyKrw] = await Promise.all([
    fetchYahooLatestClose("KRW=X"),
    fetchYahooLatestClose("JPYKRW=X"),
  ]);

  return { usdKrw, jpyKrw };
}
