import { describe, expect, it } from "vitest";
import { createEmptySnapshot } from "@/lib/agent/holdings-storage";
import { computeValuation, convertToKrw } from "./valuation";

describe("valuation", () => {
  const fx = { usdKrw: 1350, jpyKrw: 9.2 };

  it("KRW 현금만 있으면 총자산=현금", () => {
    const snap = createEmptySnapshot();
    snap.cash.krw = 1_000_000;
    const r = computeValuation(snap, {}, fx);
    expect(r.totalKrw).toBe(1_000_000);
    expect(r.cashKrw).toBe(1_000_000);
  });

  it("USD 종목은 환율·스프레드로 KRW 환산", () => {
    const snap = createEmptySnapshot();
    snap.holdings.push({
      id: "1",
      ticker: "SOXX",
      quantity: 10,
      avgCost: 200,
      assetType: "etf",
      currency: "USD",
    });
    const r = computeValuation(snap, { SOXX: 100 }, fx);
    expect(r.holdingsKrw).toBeGreaterThan(1_000_000);
    expect(r.warnings).toHaveLength(0);
  });

  it("매수가 대비 수익률을 계산한다", () => {
    const snap = createEmptySnapshot();
    snap.holdings.push({
      id: "1",
      ticker: "005930.KS",
      quantity: 10,
      avgCost: 70_000,
      assetType: "stock",
      currency: "KRW",
    });
    const r = computeValuation(snap, { "005930.KS": 80_000 }, fx);
    expect(r.holdings[0].returnPct).toBeCloseTo(14.29, 1);
    expect(r.holdingsReturnPct).toBeCloseTo(14.29, 1);
    expect(r.holdingsPnlKrw).toBe(100_000);
  });

  it("convertToKrw applies spread", () => {
    const krw = convertToKrw(100, "USD", fx);
    expect(krw).toBeGreaterThan(100 * fx.usdKrw);
  });
});
