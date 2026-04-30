import type {
  OptimizationMethod,
  PortfolioMetrics,
  PortfolioPoint,
} from "@/types";

const TRADING_DAYS = 252;
const N_SAMPLES = 10_000;

/** Mulberry32 deterministic PRNG. */
function makeRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** log-returns aligned by index. prices[t][i]: close of asset i at time t. */
export function logReturns(closesByTicker: number[][]): number[][] {
  const n = closesByTicker.length;
  if (n === 0) return [];
  const T = closesByTicker[0].length;
  const out: number[][] = [];
  for (let t = 1; t < T; t++) {
    const row: number[] = [];
    for (let i = 0; i < n; i++) {
      const a = closesByTicker[i][t - 1];
      const b = closesByTicker[i][t];
      row.push(Math.log(b / a));
    }
    out.push(row);
  }
  return out;
}

/** Sample mean per asset (column-wise). */
function meanVec(returns: number[][]): number[] {
  if (returns.length === 0) return [];
  const n = returns[0].length;
  const mu = new Array(n).fill(0);
  for (const row of returns) for (let i = 0; i < n; i++) mu[i] += row[i];
  for (let i = 0; i < n; i++) mu[i] /= returns.length;
  return mu;
}

/** Sample covariance matrix (population, /T). */
function covMatrix(returns: number[][], mu: number[]): number[][] {
  const n = mu.length;
  const cov: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
  const T = returns.length;
  for (const row of returns) {
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        cov[i][j] += (row[i] - mu[i]) * (row[j] - mu[j]);
      }
    }
  }
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++) cov[i][j] /= Math.max(T - 1, 1);
  return cov;
}

function dot(a: number[], b: number[]): number {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
}

function matVec(A: number[][], v: number[]): number[] {
  const n = A.length;
  const out = new Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    let s = 0;
    for (let j = 0; j < n; j++) s += A[i][j] * v[j];
    out[i] = s;
  }
  return out;
}

function quadForm(w: number[], A: number[][]): number {
  return dot(w, matVec(A, w));
}

/** Dirichlet sample via normalized exponentials. */
function sampleSimplex(rng: () => number, n: number): number[] {
  const v = new Array(n);
  let s = 0;
  for (let i = 0; i < n; i++) {
    // -ln(U) ~ Exp(1)
    const e = -Math.log(Math.max(rng(), 1e-12));
    v[i] = e;
    s += e;
  }
  for (let i = 0; i < n; i++) v[i] /= s;
  return v;
}

interface Stats {
  expectedReturn: number;
  volatility: number;
  sharpe: number;
}

function portfolioStats(
  w: number[],
  muAnnual: number[],
  covAnnual: number[][]
): Stats {
  const er = dot(w, muAnnual);
  const variance = quadForm(w, covAnnual);
  const vol = Math.sqrt(Math.max(variance, 0));
  const sharpe = vol > 0 ? er / vol : 0;
  return { expectedReturn: er, volatility: vol, sharpe };
}

/** Risk parity via simple fixed-point: w_i_new = (w_i * total_var) / (n * (Sw)_i) then normalize. */
function riskParity(covAnnual: number[][], maxIter = 1000, tol = 1e-7): number[] {
  const n = covAnnual.length;
  let w = new Array(n).fill(1 / n);
  for (let iter = 0; iter < maxIter; iter++) {
    const Sw = matVec(covAnnual, w);
    const totalVar = dot(w, Sw);
    const target = totalVar / n;
    let maxDiff = 0;
    const next = new Array(n);
    let sum = 0;
    for (let i = 0; i < n; i++) {
      const rc = w[i] * Sw[i];
      const factor = Math.sqrt(target / Math.max(rc, 1e-12));
      next[i] = Math.max(w[i] * factor, 1e-9);
      sum += next[i];
    }
    for (let i = 0; i < n; i++) next[i] /= sum;
    for (let i = 0; i < n; i++) maxDiff = Math.max(maxDiff, Math.abs(next[i] - w[i]));
    w = next;
    if (maxDiff < tol) break;
  }
  return w;
}

export function calcMetrics(
  weights: number[],
  closesByTicker: number[][]
): PortfolioMetrics {
  const ret = logReturns(closesByTicker);
  if (ret.length === 0) {
    return { annualReturn: 0, volatility: 0, sharpe: 0, mdd: 0 };
  }
  const mu = meanVec(ret);
  const cov = covMatrix(ret, mu);
  const muAnn = mu.map((x) => x * TRADING_DAYS);
  const covAnn = cov.map((row) => row.map((v) => v * TRADING_DAYS));
  const stats = portfolioStats(weights, muAnn, covAnn);

  // MDD + CAGR on portfolio cumulative simple returns
  const T = ret.length;
  const portReturns = new Array(T);
  for (let t = 0; t < T; t++) {
    let r = 0;
    for (let i = 0; i < weights.length; i++) {
      r += weights[i] * (Math.exp(ret[t][i]) - 1);
    }
    portReturns[t] = r;
  }
  let cumMax = 1;
  let mdd = 0;
  let cum = 1;
  for (const r of portReturns) {
    cum *= 1 + r;
    if (cum > cumMax) cumMax = cum;
    const dd = (cum - cumMax) / cumMax;
    if (dd < mdd) mdd = dd;
  }

  // CAGR: 백테스팅 실제 기간 기준 복리 연환산 수익률
  const cagr = Math.pow(Math.max(cum, 1e-12), TRADING_DAYS / T) - 1;

  return {
    annualReturn: cagr,
    volatility: stats.volatility,
    sharpe: stats.sharpe,
    mdd,
  };
}

export interface OptimizationResult {
  optimal: PortfolioPoint;
  frontier: PortfolioPoint[];
  metrics: PortfolioMetrics;
}

export function runOptimization(
  pricesByTicker: Record<string, number[]>,
  method: OptimizationMethod,
  options?: { samples?: number; seed?: number }
): OptimizationResult {
  const tickers = Object.keys(pricesByTicker);
  const n = tickers.length;
  if (n < 2) throw new Error("at least 2 tickers required");

  const closes = tickers.map((t) => pricesByTicker[t]);
  const T0 = Math.min(...closes.map((c) => c.length));
  const aligned = closes.map((c) => c.slice(c.length - T0));

  const ret = logReturns(aligned);
  const mu = meanVec(ret);
  const cov = covMatrix(ret, mu);
  const muAnn = mu.map((x) => x * TRADING_DAYS);
  const covAnn = cov.map((row) => row.map((v) => v * TRADING_DAYS));

  const samples = options?.samples ?? N_SAMPLES;
  const rng = makeRng(options?.seed ?? 42);

  const frontier: PortfolioPoint[] = [];
  let bestSharpeIdx = 0;
  let bestVolIdx = 0;
  let bestSharpeW: number[] = [];
  let bestVolW: number[] = [];
  for (let i = 0; i < samples; i++) {
    const w = sampleSimplex(rng, n);
    const stats = portfolioStats(w, muAnn, covAnn);
    frontier.push({
      expectedReturn: stats.expectedReturn,
      volatility: stats.volatility,
      sharpe: stats.sharpe,
    });
    if (i === 0 || stats.sharpe > frontier[bestSharpeIdx].sharpe) {
      bestSharpeIdx = i;
      bestSharpeW = w;
    }
    if (i === 0 || stats.volatility < frontier[bestVolIdx].volatility) {
      bestVolIdx = i;
      bestVolW = w;
    }
  }

  let optimalWeights: number[];
  if (method === "max-sharpe") {
    optimalWeights = bestSharpeW;
  } else if (method === "min-variance") {
    optimalWeights = bestVolW;
  } else {
    optimalWeights = riskParity(covAnn);
  }

  const optStats = portfolioStats(optimalWeights, muAnn, covAnn);
  const optimal: PortfolioPoint = {
    weights: Object.fromEntries(tickers.map((t, k) => [t, optimalWeights[k]])),
    expectedReturn: optStats.expectedReturn,
    volatility: optStats.volatility,
    sharpe: optStats.sharpe,
  };

  // 시각화용 frontier는 균일 샘플링으로 다운사이징한다 — 10k 포인트 전체를
  // localStorage에 저장하면 result 1건당 ~1.5MB로 5MB 쿼터를 빠르게 소진한다.
  const FRONTIER_OUT = 500;
  const stride = Math.max(1, Math.floor(samples / FRONTIER_OUT));
  const frontierOut: PortfolioPoint[] = [];
  for (let i = 0; i < frontier.length; i += stride) {
    frontierOut.push(frontier[i]);
  }

  const metrics = calcMetrics(optimalWeights, aligned);

  return { optimal, frontier: frontierOut, metrics };
}

export function riskContributions(
  weights: number[],
  covAnnual: number[][]
): number[] {
  const Sw = matVec(covAnnual, weights);
  return weights.map((w, i) => w * Sw[i]);
}
