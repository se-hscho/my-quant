import { describe, expect, it, vi, beforeEach } from "vitest";
import { DEMO_PORTFOLIO_SNAPSHOT } from "@/lib/agent/demo-portfolio";

vi.mock("@/lib/agent/yahoo-quote", () => ({
  fetchFxRatesFromYahoo: vi.fn(async () => ({ usdKrw: null, jpyKrw: null })),
  fetchYahooLatestClose: vi.fn(async () => null),
  toYahooSymbol: (t: string) => t,
}));

import { resolveValuation } from "./market-data";

describe("resolveValuation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("Yahoo 실패 시 데모 스냅샷은 seed 폴백으로 valuation을 반환한다", async () => {
    const result = await resolveValuation(DEMO_PORTFOLIO_SNAPSHOT);
    expect(result).not.toBeNull();
    expect(result!.valuation.totalKrw).toBeGreaterThan(0);
    expect(result!.priceSource).toBe("demo-seed");
  });

  it("일반 스냅샷은 Yahoo 실패 시 null", async () => {
    const result = await resolveValuation({
      holdings: [
        {
          id: "1",
          ticker: "SOXX",
          quantity: 1,
          assetType: "etf",
          currency: "USD",
        },
      ],
      cash: { krw: 0, usd: 0, jpy: 0 },
      updatedAt: new Date().toISOString(),
    });
    expect(result).toBeNull();
  });
});
