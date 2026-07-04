import { describe, expect, it } from "vitest";
import { createEmptySnapshot } from "@/lib/agent/holdings-storage";
import { getSmartMoneyFixture } from "@/services/smart-money/adapter";
import { getContextFixture } from "@/services/context/adapter";
import {
  buildCashDeploymentScenarios,
  buildInvestmentDirection,
} from "./cash-deployment";
import { validateScenarioWeights } from "./scenarios";

describe("cash deployment", () => {
  const snap = createEmptySnapshot();
  snap.cash.krw = 20_000_000;

  const valuation = {
    totalKrw: 20_000_000,
    cashKrw: 20_000_000,
    holdingsKrw: 0,
    holdings: [],
    fx: { usdKrw: 1350, jpyKrw: 9 },
    warnings: [],
  };

  it("2천만원 현금만으로 투자 방향·3가지 조합을 생성", () => {
    const direction = buildInvestmentDirection({
      snapshot: snap,
      valuation,
      smartMoney: getSmartMoneyFixture(),
      context: getContextFixture(),
    });

    expect(direction.mode).toBe("deployment");
    expect(direction.combinations).toHaveLength(3);
    expect(direction.combinations[0].tickers.length).toBeGreaterThan(0);
    expect(direction.combinations[0].tickers[0].amountKrw).toBeGreaterThan(0);
    expect(direction.evidenceLinks.length).toBeGreaterThan(0);
    expect(direction.combinations[0].holdGuide.rebalanceTriggers.length).toBeGreaterThan(0);
  });

  it("배분 시나리오 After 비중 합 100%±0.1%p", () => {
    const direction = buildInvestmentDirection({
      snapshot: snap,
      valuation,
      smartMoney: getSmartMoneyFixture(),
      context: getContextFixture(),
    });
    const scenarios = buildCashDeploymentScenarios({ snapshot: snap, valuation, direction });
    for (const s of scenarios) {
      expect(validateScenarioWeights(s)).toBe(true);
    }
    expect(scenarios[0].weightsBefore.CASH).toBe(100);
    expect(scenarios[1].playbook.some((p) => p.action === "buy")).toBe(true);
  });

  it("추천 톤과 근거 링크 URL 포함", () => {
    const direction = buildInvestmentDirection({
      snapshot: snap,
      valuation,
      smartMoney: getSmartMoneyFixture(),
      context: getContextFixture(),
    });
    for (const combo of direction.combinations) {
      expect(combo.marketRationale).toMatch(/참고용/);
      expect(combo.evidenceLinks.every((l) => l.url.startsWith("https://"))).toBe(true);
    }
  });
});
