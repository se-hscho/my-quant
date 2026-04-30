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

  let res: Response;
  try {
    res = await fetch(
      `/api/prices?ticker=${encodeURIComponent(ticker)}&range=${encodeURIComponent(range)}`,
      { signal: AbortSignal.timeout(15_000) }
    );
  } catch (err) {
    const isTimeout =
      err instanceof Error && (err.name === "TimeoutError" || /timeout|abort/i.test(err.message));
    throw new Error(
      isTimeout
        ? `${ticker}: 데이터 응답 시간 초과 (재시도해 주세요)`
        : `${ticker}: 네트워크 오류`
    );
  }

  if (!res.ok) {
    let msg = `${ticker}: 데이터 가져오기 실패 (${res.status})`;
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
