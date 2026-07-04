import { describe, it, expect, beforeEach } from "vitest";
import { applyChatActions } from "./apply-chat-actions";
import { clearHoldings, loadHoldingsSnapshot } from "./holdings-storage";

describe("applyChatActions", () => {
  beforeEach(() => {
    clearHoldings();
  });

  it("add_holding이 localStorage에 반영된다", () => {
    applyChatActions([
      {
        type: "add_holding",
        ticker: "SOXX",
        quantity: 10,
        assetType: "etf",
        currency: "USD",
      },
    ]);
    const snap = loadHoldingsSnapshot();
    expect(snap?.holdings).toHaveLength(1);
    expect(snap?.holdings[0].ticker).toBe("SOXX");
  });

  it("set_cash가 localStorage에 반영된다", () => {
    applyChatActions([{ type: "set_cash", field: "krw", amount: 5_000_000 }]);
    expect(loadHoldingsSnapshot()?.cash.krw).toBe(5_000_000);
  });
});
