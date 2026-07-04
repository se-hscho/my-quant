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

  it("avgCost가 있으면 Yahoo 실패 시에도 부분 valuation", async () => {
    const result = await resolveValuation({
      holdings: [
        {
          id: "1",
          ticker: "SOXX",
          quantity: 10,
          avgCost: 200,
          assetType: "etf",
          currency: "USD",
        },
      ],
      cash: { krw: 1_000_000, usd: 0, jpy: 0 },
      updatedAt: new Date().toISOString(),
    });
    expect(result).not.toBeNull();
    expect(result!.priceSource).toBe("yahoo-partial");
    expect(result!.valuation.holdings).toHaveLength(1);
  });

  it("시세·매수가 모두 없고 현금도 없으면 null", async () => {
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
