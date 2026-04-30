import { describe, it, expect } from "vitest";
import { calcBacktest } from "./backtesting";

describe("calcBacktest", () => {
  const dates = Array.from({ length: 600 }, (_, i) => `d${i}`);
  const a = Array.from({ length: 600 }, (_, i) => 100 * (1 + 0.0003) ** i);
  const b = Array.from({ length: 600 }, (_, i) => 100 * (1 + 0.0006) ** i);

  it("range='1y' 사용 시 252개 시점만 잘라낸다", () => {
    const r = calcBacktest({
      pricesByTicker: { A: a, B: b },
      dates,
      weights: { A: 0.5, B: 0.5 },
      range: "1y",
    });
    expect(r.dates).toHaveLength(252);
    expect(r.optimalReturns).toHaveLength(252);
    expect(r.buyHoldReturns).toHaveLength(252);
  });

  it("결과는 첫 시점 0으로 시작하고 두 시리즈 길이가 같다", () => {
    const r = calcBacktest({
      pricesByTicker: { A: a, B: b },
      dates,
      weights: { A: 0.5, B: 0.5 },
      range: "3y",
    });
    expect(r.optimalReturns[0]).toBe(0);
    expect(r.buyHoldReturns[0]).toBe(0);
    expect(r.optimalReturns).toHaveLength(r.buyHoldReturns.length);
  });

  it("균등 가중일 때 optimal과 buy&hold가 동일하다", () => {
    const r = calcBacktest({
      pricesByTicker: { A: a, B: b },
      dates,
      weights: { A: 0.5, B: 0.5 },
      range: "5y",
    });
    for (let i = 0; i < r.optimalReturns.length; i++) {
      expect(Math.abs(r.optimalReturns[i] - r.buyHoldReturns[i])).toBeLessThan(1e-9);
    }
  });

  it("최적이 고수익 자산에 가중치를 더 줬을 때 buy&hold보다 더 높은 누적수익률", () => {
    const r = calcBacktest({
      pricesByTicker: { A: a, B: b },
      dates,
      weights: { A: 0.1, B: 0.9 },
      range: "10y",
    });
    const last = r.optimalReturns.length - 1;
    expect(r.optimalReturns[last]).toBeGreaterThan(r.buyHoldReturns[last]);
  });
});
