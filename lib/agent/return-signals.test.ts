import { describe, expect, it } from "vitest";
import { classifyReturnSignal } from "./return-signals";
import type { HoldingValuation } from "./valuation";

function holding(returnPct: number): HoldingValuation {
  return {
    id: "1",
    ticker: "SOXX",
    quantity: 10,
    currency: "USD",
    price: 250,
    valueNative: 2500,
    valueKrw: 3_000_000,
    returnPct,
    pnlKrw: 500_000,
  };
}

describe("classifyReturnSignal", () => {
  it("고수익 + 과대 비중 시 take_profit", () => {
    const s = classifyReturnSignal(holding(30), 0.8);
    expect(s?.hint).toBe("take_profit");
  });

  it("심각 손실 + 유출 섹터 시 cut_loss", () => {
    const s = classifyReturnSignal(holding(-20), 0.3);
    expect(s?.hint).toBe("cut_loss");
  });

  it("손실 + 유입 섹터 시 hold_loss", () => {
    const s = classifyReturnSignal(holding(-20), 0.7);
    expect(s?.hint).toBe("hold_loss");
  });

  it("소폭 하락 + 유입 시 dip_add", () => {
    const s = classifyReturnSignal(holding(-12), 0.75);
    expect(s?.hint).toBe("dip_add");
  });
});
