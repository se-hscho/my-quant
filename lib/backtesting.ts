export interface BacktestSeries {
  dates: string[];
  optimalReturns: number[];
  buyHoldReturns: number[];
}

export type BacktestRange = "1y" | "3y" | "5y" | "10y";

const DAYS_PER_YEAR = 252;

const RANGE_DAYS: Record<BacktestRange, number> = {
  "1y": DAYS_PER_YEAR,
  "3y": DAYS_PER_YEAR * 3,
  "5y": DAYS_PER_YEAR * 5,
  "10y": DAYS_PER_YEAR * 10,
};

export interface BacktestInput {
  /** ticker → close 시계열 (모두 같은 길이로 정렬돼 있어야 한다) */
  pricesByTicker: Record<string, number[]>;
  dates: string[];
  weights: Record<string, number>;
  range: BacktestRange;
}

/**
 * 최적 가중치 vs Buy & Hold(균등 가중) 누적 수익률 시계열 계산.
 * 두 시리즈는 모두 1.0(=100%)을 시작으로 한다.
 */
export function calcBacktest({
  pricesByTicker,
  dates,
  weights,
  range,
}: BacktestInput): BacktestSeries {
  const tickers = Object.keys(weights);
  if (tickers.length === 0) {
    return { dates: [], optimalReturns: [], buyHoldReturns: [] };
  }

  const fullLen = pricesByTicker[tickers[0]]?.length ?? 0;
  const want = Math.min(RANGE_DAYS[range], fullLen);
  const start = Math.max(fullLen - want, 0);
  const slicedDates = dates.slice(start);
  const closes: Record<string, number[]> = {};
  for (const t of tickers) {
    closes[t] = (pricesByTicker[t] ?? []).slice(start);
  }

  const T = slicedDates.length;
  const equalW = 1 / tickers.length;

  const optimalReturns: number[] = [];
  const buyHoldReturns: number[] = [];

  let optCum = 1;
  let bhCum = 1;
  optimalReturns.push(0);
  buyHoldReturns.push(0);
  for (let t = 1; t < T; t++) {
    let optStep = 0;
    let bhStep = 0;
    for (const ticker of tickers) {
      const prev = closes[ticker][t - 1];
      const cur = closes[ticker][t];
      if (prev <= 0 || !Number.isFinite(prev) || !Number.isFinite(cur)) continue;
      const r = cur / prev - 1;
      optStep += weights[ticker] * r;
      bhStep += equalW * r;
    }
    optCum *= 1 + optStep;
    bhCum *= 1 + bhStep;
    optimalReturns.push(optCum - 1);
    buyHoldReturns.push(bhCum - 1);
  }

  return { dates: slicedDates, optimalReturns, buyHoldReturns };
}
