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
      assetType: "etf",
      currency: "USD",
    });
    const r = computeValuation(snap, { SOXX: 100 }, fx);
    expect(r.holdingsKrw).toBeGreaterThan(1_000_000);
    expect(r.warnings).toHaveLength(0);
  });

  it("convertToKrw applies spread", () => {
    const krw = convertToKrw(100, "USD", fx);
    expect(krw).toBeGreaterThan(100 * fx.usdKrw);
  });
});
