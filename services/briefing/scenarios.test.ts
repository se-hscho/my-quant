import { describe, expect, it } from "vitest";
import { createEmptySnapshot } from "@/lib/agent/holdings-storage";
import type { ValuationResult } from "@/lib/agent/valuation";
import {
  buildScenarios,
  scenarioHasSellSteps,
  scenarioHasSplitTrades,
  validatePlaybookCurrencyRules,
  validateScenarioWeights,
} from "./scenarios";

function mockValuation(
  holdings: Array<{ ticker: string; valueKrw: number }>,
  cashKrw: number,
  usdKrw = 1350
): ValuationResult {
  const holdingsKrw = holdings.reduce((s, h) => s + h.valueKrw, 0);
  return {
    totalKrw: holdingsKrw + cashKrw,
    cashKrw,
    holdingsKrw,
    holdings: holdings.map((h, i) => ({
      id: String(i),
      ticker: h.ticker,
      quantity: 1,
      currency: h.ticker.endsWith(".KS") ? "KRW" : "USD",
      price: h.valueKrw,
      valueNative: h.valueKrw,
      valueKrw: h.valueKrw,
    })),
    fx: { usdKrw, jpyKrw: 9 },
    warnings: [],
  };
}

describe("buildScenarios", () => {
  it("안 0~3 After 비중 합이 100%±0.1%p", () => {
    const snap = createEmptySnapshot();
    snap.holdings.push({
      id: "1",
      ticker: "SOXX",
      quantity: 10,
      assetType: "etf",
      currency: "USD",
      sector: "semiconductor",
    });
    const valuation = mockValuation([{ ticker: "SOXX", valueKrw: 8_000_000 }], 2_000_000);
    const scenarios = buildScenarios(snap, valuation);
    for (const s of scenarios) {
      expect(validateScenarioWeights(s)).toBe(true);
    }
  });

  it("Before 비중은 시장가치 기준(균등 분할 아님)", () => {
    const snap = createEmptySnapshot();
    snap.holdings.push(
      {
        id: "1",
        ticker: "A",
        quantity: 1,
        assetType: "stock",
        currency: "KRW",
      },
      {
        id: "2",
        ticker: "B",
        quantity: 1,
        assetType: "stock",
        currency: "KRW",
      }
    );
    const valuation = mockValuation(
      [
        { ticker: "A", valueKrw: 7_000_000 },
        { ticker: "B", valueKrw: 1_000_000 },
      ],
      2_000_000
    );
    const scenarios = buildScenarios(snap, valuation);
    expect(scenarios[0].weightsBefore.A).toBe(70);
    expect(scenarios[0].weightsBefore.B).toBe(10);
    expect(scenarios[0].weightsBefore.CASH).toBe(20);
  });

  it("Follow·선점은 분할 매수 단계를 포함", () => {
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
    expect(scenarioHasSplitTrades(scenarios[1])).toBe(true);
    expect(scenarioHasSplitTrades(scenarios[2])).toBe(true);
    expect(scenarios[1].playbook.filter((p) => p.action === "buy").length).toBe(3);
  });

  it("현금 부족·과대 비중 시 매도 단계 생성", () => {
    const snap = createEmptySnapshot();
    snap.holdings.push(
      {
        id: "1",
        ticker: "SOXX",
        quantity: 10,
        assetType: "etf",
        currency: "USD",
        sector: "semiconductor",
      },
      {
        id: "2",
        ticker: "QQQ",
        quantity: 5,
        assetType: "etf",
        currency: "USD",
        sector: "technology",
      }
    );
    snap.cash.usd = 6000;
    const valuation = mockValuation(
      [
        { ticker: "SOXX", valueKrw: 3_000_000 },
        { ticker: "QQQ", valueKrw: 6_700_000 },
      ],
      300_000
    );
    const scenarios = buildScenarios(snap, valuation);
    expect(scenarioHasSellSteps(scenarios[1])).toBe(true);
  });

  it("KR 종목 매수·매도는 KRW 통화", () => {
    const snap = createEmptySnapshot();
    snap.holdings.push({
      id: "1",
      ticker: "005930.KS",
      quantity: 10,
      assetType: "stock",
      currency: "KRW",
      sector: "semiconductor",
    });
    const valuation = mockValuation([{ ticker: "005930.KS", valueKrw: 4_000_000 }], 1_000_000);
    const scenarios = buildScenarios(snap, valuation);
    for (const s of scenarios) {
      expect(validatePlaybookCurrencyRules(s)).toBe(true);
    }
  });
});
