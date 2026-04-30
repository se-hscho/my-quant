import type { PriceCache } from "@/types";

const PREFIX = "quant:cache:";

function keyFor(ticker: string, range: string) {
  return `${PREFIX}${ticker}:${range}`;
}

function midnightTodayMs(now = Date.now()): number {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function loadCache(ticker: string, range: string): PriceCache | null {
  if (typeof localStorage === "undefined") return null;
  const raw = localStorage.getItem(keyFor(ticker, range));
  if (!raw) return null;
  try {
    const cache = JSON.parse(raw) as PriceCache;
    // 당일 자정 이전에 저장된 캐시는 무효 (오늘 자정 이후로 갱신 필요)
    if (cache.cachedAt < midnightTodayMs()) {
      localStorage.removeItem(keyFor(ticker, range));
      return null;
    }
    return cache;
  } catch {
    return null;
  }
}

export function saveCache(cache: PriceCache): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(keyFor(cache.ticker, cache.range), JSON.stringify(cache));
  } catch {
    // quota 등 무시
  }
}

export function clearCache(): void {
  if (typeof localStorage === "undefined") return;
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const key = localStorage.key(i);
    if (key && key.startsWith(PREFIX)) localStorage.removeItem(key);
  }
}
