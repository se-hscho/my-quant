import { describe, expect, it } from "vitest";
import { createEmptySnapshot } from "@/lib/agent/holdings-storage";
import { buildAnalysisGuideSnapshot } from "./analysis-layers";
import type { ValuationResult } from "./valuation";

function mockValuation(
  snapshot: ReturnType<typeof createEmptySnapshot>,
  holdings: Array<{ ticker: string; valueKrw: number }>
): ValuationResult {
  const holdingsKrw = holdings.reduce((s, h) => s + h.valueKrw, 0);
  const cashKrw = snapshot.cash.krw;
  return {
    totalKrw: holdingsKrw + cashKrw,
    cashKrw,
    holdingsKrw,
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

describe("buildAnalysisGuideSnapshot", () => {
  it("L0~L4 계층을 모두 반환한다", () => {
    const snap = createEmptySnapshot();
    snap.holdings.push({
      id: "1",
      ticker: "005930.KS",
      quantity: 10,
      assetType: "stock",
      currency: "KRW",
      sector: "semiconductor",
    });
    snap.cash.krw = 2_000_000;
    const valuation = mockValuation(snap, [{ ticker: "005930.KS", valueKrw: 8_000_000 }]);
    const guide = buildAnalysisGuideSnapshot(snap, valuation);
    expect(guide.layers.map((l) => l.layer)).toEqual(["L0", "L1", "L2", "L3", "L4"]);
    expect(guide.layers.find((l) => l.layer === "L4")?.items[0]?.key).toBe("005930.KS");
  });
});
