import { describe, expect, it, vi } from "vitest";
import { enrichBrokeragePasteRows } from "./enrich-paste-holdings";

vi.mock("@/lib/agent/yahoo-quote", () => ({
  fetchFxRatesFromYahoo: vi.fn(async () => ({ usdKrw: 1350, jpyKrw: 9.2 })),
  fetchYahooLatestClose: vi.fn(async (ticker: string) =>
    ticker === "AMT" ? 200 : 80
  ),
}));

describe("enrichBrokeragePasteRows", () => {
  it("평가·수익률·현재가로 수량과 매수가를 역산한다", async () => {
    const rows = await enrichBrokeragePasteRows([
      {
        name: "AMT",
        ticker: "AMT",
        valueKrw: 6_346_704,
        returnPct: -28.51,
        quantity: 1,
        assetType: "stock",
        currency: "USD",
      },
    ]);

    expect(rows[0].quantity).toBeGreaterThan(1);
    expect(rows[0].avgCost).toBeGreaterThan(0);
    expect(rows[0].pnlKrw).toBeLessThan(0);
  });
});
