import { describe, it, expect } from "vitest";
import {
  calcMetrics,
  logReturns,
  riskContributions,
  runOptimization,
} from "./optimization";

// 결정적 가격 시리즈 — 두 개의 자산: A(저변동성, 낮은 수익), B(고변동성, 높은 수익).
function syntheticPrices(): Record<string, number[]> {
  const T = 600;
  const a: number[] = [100];
  const b: number[] = [100];
  for (let t = 1; t < T; t++) {
    // 결정적 패턴 — 사인+노이즈
    const noiseA = Math.sin(t * 0.13) * 0.003 + 0.0002;
    const noiseB = Math.sin(t * 0.27) * 0.012 + 0.0006;
    a.push(a[t - 1] * (1 + noiseA));
    b.push(b[t - 1] * (1 + noiseB));
  }
  return { A: a, B: b };
}

function tripleAssets(): Record<string, number[]> {
  const T = 600;
  const a: number[] = [100], b: number[] = [100], c: number[] = [100];
  for (let t = 1; t < T; t++) {
    a.push(a[t - 1] * (1 + Math.sin(t * 0.11) * 0.004 + 0.0003));
    b.push(b[t - 1] * (1 + Math.sin(t * 0.19) * 0.010 + 0.0005));
    c.push(c[t - 1] * (1 + Math.cos(t * 0.07) * 0.006 + 0.0002));
  }
  return { A: a, B: b, C: c };
}

describe("logReturns", () => {
  it("T-1개의 행을 만든다", () => {
    const ret = logReturns([
      [100, 110, 121],
      [50, 55, 60],
    ]);
    expect(ret).toHaveLength(2);
    expect(ret[0]).toHaveLength(2);
  });
});

describe("runOptimization — 10,000 sample frontier", () => {
  it("frontier에 시각화용 다운샘플 배열이 반환된다 (≤ 1000)", () => {
    const r = runOptimization(syntheticPrices(), "max-sharpe");
    expect(r.frontier.length).toBeGreaterThan(0);
    expect(r.frontier.length).toBeLessThanOrEqual(1000);
  });

  it("Max Sharpe 결과는 weights 합이 1.0 (±0.001) 이고 frontier 내 sharpe 최대다", () => {
    const r = runOptimization(syntheticPrices(), "max-sharpe");
    const sum = Object.values(r.optimal.weights).reduce((a, b) => a + b, 0);
    expect(Math.abs(sum - 1)).toBeLessThan(0.001);
    const maxSharpe = Math.max(...r.frontier.map((p) => p.sharpe));
    expect(r.optimal.sharpe).toBeGreaterThanOrEqual(maxSharpe - 1e-9);
  });

  it("Min Variance 결과는 weights 합 1.0 이고 frontier vol 최솟값과 ±1% 일치", () => {
    const r = runOptimization(syntheticPrices(), "min-variance");
    const sum = Object.values(r.optimal.weights).reduce((a, b) => a + b, 0);
    expect(Math.abs(sum - 1)).toBeLessThan(0.001);
    const minVol = Math.min(...r.frontier.map((p) => p.volatility));
    expect(Math.abs(r.optimal.volatility - minVol) / minVol).toBeLessThan(0.01);
  });

  it("Risk Parity 각 자산 리스크 기여도 max-min 차이가 5% 이하", () => {
    const r = runOptimization(tripleAssets(), "risk-parity");
    const tickers = Object.keys(r.optimal.weights);
    const w = tickers.map((t) => r.optimal.weights[t]);

    // re-derive cov annual matching the same flow as runOptimization
    const closes = tickers.map((t) => tripleAssets()[t]);
    const ret = logReturns(closes);
    const T = ret.length;
    const n = tickers.length;
    const mu = new Array(n).fill(0);
    for (const row of ret) for (let i = 0; i < n; i++) mu[i] += row[i];
    for (let i = 0; i < n; i++) mu[i] /= T;
    const cov: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
    for (const row of ret)
      for (let i = 0; i < n; i++)
        for (let j = 0; j < n; j++)
          cov[i][j] += (row[i] - mu[i]) * (row[j] - mu[j]);
    for (let i = 0; i < n; i++)
      for (let j = 0; j < n; j++) cov[i][j] /= T - 1;
    const covAnn = cov.map((row) => row.map((v) => v * 252));

    const rc = riskContributions(w, covAnn);
    const total = rc.reduce((a, b) => a + b, 0);
    const share = rc.map((x) => x / total);
    const diff = Math.max(...share) - Math.min(...share);
    expect(diff).toBeLessThan(0.05);
  });
});

describe("calcMetrics", () => {
  it("annualReturn, volatility, sharpe, mdd 4개 필드를 반환한다", () => {
    const prices = syntheticPrices();
    const closes = [prices.A, prices.B];
    const m = calcMetrics([0.5, 0.5], closes);
    expect(m).toHaveProperty("annualReturn");
    expect(m).toHaveProperty("volatility");
    expect(m).toHaveProperty("sharpe");
    expect(m).toHaveProperty("mdd");
    expect(m.mdd).toBeLessThanOrEqual(0);
    expect(m.volatility).toBeGreaterThan(0);
  });
});
