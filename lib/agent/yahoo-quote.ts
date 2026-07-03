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

export async function fetchYahooLatestClose(ticker: string): Promise<number | null> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
    ticker
  )}?interval=1d&range=5d`;

  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; quant-portfolio/1.0)" },
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });

  if (!res.ok) return null;

  const data = (await res.json()) as YahooChartResponse;
  const result = data.chart.result?.[0];
  if (!result) return null;

  const adj = result.indicators.adjclose?.[0]?.adjclose;
  const raw = result.indicators.quote[0]?.close ?? [];
  const series = adj ?? raw;

  for (let i = series.length - 1; i >= 0; i--) {
    const v = series[i];
    if (v != null && Number.isFinite(v)) return v;
  }
  return null;
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
