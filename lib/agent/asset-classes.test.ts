import { describe, expect, it } from "vitest";
import { computeAssetClassWeights, resolveAssetClass } from "./asset-classes";
import type { ValuationResult } from "./valuation";
import type { HoldingsSnapshot } from "@/types/agent";

describe("resolveAssetClass", () => {
  it("채권 ETF는 bond", () => {
    expect(resolveAssetClass({ assetType: "bond_etf" })).toBe("bond");
  });

  it("금 ETF는 commodity", () => {
    expect(resolveAssetClass({ assetType: "gold_etf" })).toBe("commodity");
  });
});

describe("computeAssetClassWeights", () => {
  it("자산군별 비중을 집계한다", () => {
    const snap: HoldingsSnapshot = {
      holdings: [
        {
          id: "1",
          ticker: "SOXX",
          quantity: 1,
          assetType: "etf",
          currency: "USD",
        },
        {
          id: "2",
          ticker: "HYG",
          quantity: 1,
          assetType: "bond_etf",
          currency: "USD",
        },
      ],
      cash: { krw: 1_000_000, usd: 0, jpy: 0 },
      updatedAt: "",
    };
    const valuation: ValuationResult = {
      totalKrw: 10_000_000,
      cashKrw: 1_000_000,
      holdingsKrw: 9_000_000,
      holdings: [
        {
          id: "1",
          ticker: "SOXX",
          quantity: 1,
          currency: "USD",
          price: 1,
          valueNative: 1,
          valueKrw: 8_000_000,
        },
        {
          id: "2",
          ticker: "HYG",
          quantity: 1,
          currency: "USD",
          price: 1,
          valueNative: 1,
          valueKrw: 1_000_000,
        },
      ],
      fx: { usdKrw: 1350, jpyKrw: 9.2 },
      warnings: [],
    };

    const rows = computeAssetClassWeights(valuation, snap);
    expect(rows.find((r) => r.id === "equity")?.weightPct).toBe(80);
    expect(rows.find((r) => r.id === "bond")?.weightPct).toBe(10);
    expect(rows.find((r) => r.id === "cash")?.weightPct).toBe(10);
  });
});
