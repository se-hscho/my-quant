import { describe, it, expect, beforeEach } from "vitest";
import {
  clearHoldings,
  emptyCash,
  hasRegisteredHoldings,
  loadHoldingsSnapshot,
  saveHoldingsSnapshot,
} from "./holdings-storage";
import type { HoldingsSnapshot } from "@/types/agent";

const emptySnapshot = (): HoldingsSnapshot => ({
  holdings: [],
  cash: emptyCash(),
  updatedAt: new Date().toISOString(),
});

describe("holdings-storage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("저장 후 loadHoldingsSnapshot이 동일 스냅샷을 반환한다", () => {
    const snap: HoldingsSnapshot = {
      holdings: [
        {
          id: "h1",
          ticker: "AAPL",
          quantity: 10,
          assetType: "stock",
          currency: "USD",
        },
      ],
      cash: { krw: 1_000_000, usd: 0, jpy: 0 },
      updatedAt: "2026-07-03T00:00:00.000Z",
    };
    expect(saveHoldingsSnapshot(snap)).toBe(true);
    expect(loadHoldingsSnapshot()?.holdings[0]?.ticker).toBe("AAPL");
  });

  it("스냅샷이 없으면 hasRegisteredHoldings는 false다", () => {
    expect(hasRegisteredHoldings()).toBe(false);
  });

  it("종목이 없고 현금도 0이면 hasRegisteredHoldings는 false다", () => {
    saveHoldingsSnapshot(emptySnapshot());
    expect(hasRegisteredHoldings()).toBe(false);
  });

  it("종목이 1건 이상이면 hasRegisteredHoldings는 true다", () => {
    saveHoldingsSnapshot({
      ...emptySnapshot(),
      holdings: [
        {
          id: "h1",
          ticker: "005930.KS",
          quantity: 5,
          assetType: "stock",
          currency: "KRW",
        },
      ],
    });
    expect(hasRegisteredHoldings()).toBe(true);
  });

  it("clearHoldings 후 스냅샷이 없어진다", () => {
    saveHoldingsSnapshot(emptySnapshot());
    clearHoldings();
    expect(loadHoldingsSnapshot()).toBeNull();
  });
});
