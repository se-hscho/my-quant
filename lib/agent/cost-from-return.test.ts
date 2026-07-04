import { describe, expect, it } from "vitest";
import {
  deriveAvgCostFromPaste,
  deriveCostKrwFromReturn,
  derivePnlKrwFromReturn,
} from "./cost-from-return";

const fx = { usdKrw: 1350, jpyKrw: 9.2 };

describe("deriveCostKrwFromReturn", () => {
  it("수익률로 매수원가를 역산한다", () => {
    const cost = deriveCostKrwFromReturn(6_346_704, -28.51);
    expect(cost).toBeCloseTo(8_877_751, -1);
    const pnl = derivePnlKrwFromReturn(6_346_704, -28.51);
    expect(pnl).toBeCloseTo(-2_531_047, -1);
  });
});

describe("deriveAvgCostFromPaste", () => {
  it("KRW 종목 1주당 매수가를 역산한다", () => {
    const avg = deriveAvgCostFromPaste({
      valueKrw: 2_691,
      returnPct: -23.81,
      quantity: 1,
      currency: "KRW",
      fx,
    });
    expect(avg).toBeCloseTo(3532, 0);
  });

  it("USD 종목 1주당 매수가를 역산한다", () => {
    const avg = deriveAvgCostFromPaste({
      valueKrw: 6_346_704,
      returnPct: -28.51,
      quantity: 1,
      currency: "USD",
      fx,
    });
    expect(avg).toBeGreaterThan(0);
  });
});
