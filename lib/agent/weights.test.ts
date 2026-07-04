import { describe, expect, it } from "vitest";
import { computePortfolioWeights, computeSectorWeights, splitTrancheAmounts } from "./weights";
import type { ValuationResult } from "./valuation";
import type { HoldingsSnapshot } from "@/types/agent";

function mockValuation(
  holdings: Array<{ ticker: string; valueKrw: number }>,
  cashKrw: number
): ValuationResult {
  return {
    totalKrw: holdings.reduce((s, h) => s + h.valueKrw, 0) + cashKrw,
    cashKrw,
    holdingsKrw: holdings.reduce((s, h) => s + h.valueKrw, 0),
    holdings: holdings.map((h, i) => ({
      id: String(i),
      ticker: h.ticker,
      quantity: 1,
      currency: "KRW" as const,
      price: h.valueKrw,
      valueNative: h.valueKrw,
      valueKrw: h.valueKrw,
    })),
    fx: { usdKrw: 1350, jpyKrw: 9 },
    warnings: [],
  };
}

describe("computePortfolioWeights", () => {
  it("시장가치 비중 합이 100%±0.1%p", () => {
    const v = mockValuation(
      [
        { ticker: "A", valueKrw: 6_000_000 },
        { ticker: "B", valueKrw: 2_000_000 },
      ],
      2_000_000
    );
    const w = computePortfolioWeights(v);
    const sum = Object.values(w).reduce((a, b) => a + b, 0);
    expect(Math.abs(sum - 100)).toBeLessThanOrEqual(0.1);
    expect(w.A).toBe(60);
    expect(w.B).toBe(20);
    expect(w.CASH).toBe(20);
  });
});

describe("computeSectorWeights", () => {
  it("섹터별 비중을 집계한다", () => {
    const snap: HoldingsSnapshot = {
      holdings: [
        {
          id: "1",
          ticker: "005930.KS",
          quantity: 10,
          assetType: "stock",
          currency: "KRW",
          sector: "semiconductor",
        },
        {
          id: "2",
          ticker: "069500.KS",
          quantity: 5,
          assetType: "etf",
          currency: "KRW",
          sector: "broad_market",
        },
      ],
      cash: { krw: 0, usd: 0, jpy: 0 },
      updatedAt: "",
    };
    const v = mockValuation(
      [
        { ticker: "005930.KS", valueKrw: 3_000_000 },
        { ticker: "069500.KS", valueKrw: 1_000_000 },
      ],
      0
    );
    const rows = computeSectorWeights(v, snap);
    expect(rows.find((r) => r.sector === "semiconductor")?.weightPct).toBe(75);
    expect(rows.find((r) => r.sector === "other")?.weightPct).toBe(25);
  });
});

describe("splitTrancheAmounts", () => {
  it("균등 3분할 합이 원금과 같다", () => {
    const parts = splitTrancheAmounts(900_000, 3, false);
    expect(parts.reduce((a, b) => a + b, 0)).toBe(900_000);
  });

  it("선행 3분할 비율이 50·30·20", () => {
    const parts = splitTrancheAmounts(1_000_000, 3, true);
    expect(parts).toEqual([500_000, 300_000, 200_000]);
  });
});
