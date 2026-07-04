import { describe, expect, it } from "vitest";
import { createEmptySnapshot } from "@/lib/agent/holdings-storage";
import { getSmartMoneyFixture } from "@/services/smart-money/adapter";
import { buildScenarios } from "./scenarios";
import { buildBriefingRecommendations } from "./recommendations";

function mockValuation(
  holdings: Array<{ ticker: string; valueKrw: number }>,
  cashKrw: number
) {
  const holdingsKrw = holdings.reduce((s, h) => s + h.valueKrw, 0);
  return {
    totalKrw: holdingsKrw + cashKrw,
    cashKrw,
    holdingsKrw,
    holdings: holdings.map((h, i) => ({
      id: String(i),
      ticker: h.ticker,
      quantity: 1,
      currency: h.ticker.endsWith(".KS") ? ("KRW" as const) : ("USD" as const),
      price: h.valueKrw,
      valueNative: h.valueKrw,
      valueKrw: h.valueKrw,
    })),
    fx: { usdKrw: 1350, jpyKrw: 9 },
    warnings: [],
  };
}

describe("buildBriefingRecommendations", () => {
  it("미보유 유입 섹터는 L3 new_sector 추천", () => {
    const snap = createEmptySnapshot();
    snap.holdings.push({
      id: "1",
      ticker: "005930.KS",
      quantity: 10,
      assetType: "stock",
      currency: "KRW",
      sector: "semiconductor",
    });
    const valuation = mockValuation([{ ticker: "005930.KS", valueKrw: 9_000_000 }], 1_000_000);
    const scenarios = buildScenarios(snap, valuation);
    const smartMoney = getSmartMoneyFixture();
    const { rows, guide } = buildBriefingRecommendations({
      snapshot: snap,
      valuation,
      smartMoney,
      scenarios,
    });

    expect(guide.layers).toHaveLength(5);
    const tech = rows.find((r) => r.sector === "technology" && r.action === "new_sector");
    expect(tech?.layer).toBe("L3");
    expect(tech?.splitGuide).toBeDefined();
    expect(tech?.rationale).toMatch(/검토/);
  });

  it("보유 유입 섹터는 L4 buy + 분할 가이드", () => {
    const snap = createEmptySnapshot();
    snap.holdings.push({
      id: "1",
      ticker: "SOXX",
      quantity: 10,
      assetType: "etf",
      currency: "USD",
      sector: "semiconductor",
    });
    snap.cash.usd = 6000;
    const valuation = mockValuation([{ ticker: "SOXX", valueKrw: 9_000_000 }], 1_000_000);
    const scenarios = buildScenarios(snap, valuation);
    const { rows } = buildBriefingRecommendations({
      snapshot: snap,
      valuation,
      smartMoney: getSmartMoneyFixture(),
      scenarios,
    });

    const semi = rows.find((r) => r.sector === "semiconductor" && r.action === "buy");
    expect(semi?.layer).toBe("L4");
    expect(semi?.splitGuide).toMatch(/분할/);
    expect(semi?.signals.length).toBeGreaterThan(0);
  });

  it("추천 톤에 검토·고려가 포함되고 확정 매수 문구가 없다", () => {
    const snap = createEmptySnapshot();
    snap.holdings.push({
      id: "1",
      ticker: "SOXX",
      quantity: 10,
      assetType: "etf",
      currency: "USD",
      sector: "semiconductor",
    });
    const valuation = mockValuation([{ ticker: "SOXX", valueKrw: 5_000_000 }], 5_000_000);
    const scenarios = buildScenarios(snap, valuation);
    const { rows } = buildBriefingRecommendations({
      snapshot: snap,
      valuation,
      smartMoney: getSmartMoneyFixture(),
      scenarios,
    });

    for (const r of rows) {
      expect(r.rationale).toMatch(/검토|고려|참고용/);
      expect(r.rationale).not.toMatch(/반드시 매수|즉시 매수/);
    }
  });
});
