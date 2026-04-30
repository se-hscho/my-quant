import type { PriceCache } from "@/types";
import { loadCache, saveCache } from "./cache";

export interface PriceSeries {
  ticker: string;
  range: string;
  dates: string[];
  closes: number[];
}

export async function fetchPrices(
  ticker: string,
  range: string
): Promise<PriceSeries> {
  const cached = loadCache(ticker, range);
  if (cached) {
    return {
      ticker: cached.ticker,
      range: cached.range,
      dates: cached.dates,
      closes: cached.closes,
    };
  }

  const res = await fetch(
    `/api/prices?ticker=${encodeURIComponent(ticker)}&range=${encodeURIComponent(range)}`
  );
  if (!res.ok) {
    let msg = `prices fetch failed (${res.status})`;
    try {
      const j = (await res.json()) as { error?: string };
      if (j.error) msg = j.error;
    } catch {
      /* ignore */
    }
    throw new Error(msg);
  }

  const json = (await res.json()) as PriceSeries;
  if (!json.dates?.length || !json.closes?.length) {
    throw new Error("empty price series");
  }

  const cache: PriceCache = {
    ticker: json.ticker,
    range: json.range,
    dates: json.dates,
    closes: json.closes,
    cachedAt: Date.now(),
  };
  saveCache(cache);
  return json;
}
