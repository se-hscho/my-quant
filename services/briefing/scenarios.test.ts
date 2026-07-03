import { describe, expect, it } from "vitest";
import { createEmptySnapshot } from "@/lib/agent/holdings-storage";
import {
  buildScenarios,
  validatePlaybookCurrencyRules,
  validateScenarioWeights,
} from "./scenarios";

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
    const scenarios = buildScenarios(snap, 10_000_000, 1350);
    for (const s of scenarios) {
      expect(validateScenarioWeights(s)).toBe(true);
    }
  });

  it("KR 종목 매수는 KRW 통화", () => {
    const snap = createEmptySnapshot();
    snap.holdings.push({
      id: "1",
      ticker: "005930.KS",
      quantity: 10,
      assetType: "stock",
      currency: "KRW",
    });
    const scenarios = buildScenarios(snap, 5_000_000, 1350);
    for (const s of scenarios) {
      expect(validatePlaybookCurrencyRules(s)).toBe(true);
    }
  });
});
