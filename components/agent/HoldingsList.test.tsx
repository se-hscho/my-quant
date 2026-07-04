import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { HoldingsList } from "./HoldingsList";
import type { HoldingsSnapshot } from "@/types/agent";

const snapshot: HoldingsSnapshot = {
  holdings: [
    {
      id: "1",
      ticker: "SOXX",
      quantity: 10,
      avgCost: 200,
      assetType: "etf",
      currency: "USD",
      sector: "semiconductor",
    },
    {
      id: "2",
      ticker: "005930.KS",
      quantity: 50,
      avgCost: 70_000,
      assetType: "stock",
      currency: "KRW",
    },
  ],
  cash: { krw: 50_000_000, usd: 12_000, jpy: 0 },
  updatedAt: "2026-07-03T00:00:00.000Z",
};

describe("HoldingsList", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          totalKrw: 100_000_000,
          cashKrw: 50_000_000,
          holdingsKrw: 50_000_000,
          holdings: [
            {
              id: "1",
              ticker: "SOXX",
              quantity: 10,
              currency: "USD",
              price: 250,
              valueNative: 2500,
              valueKrw: 3_375_000,
              avgCost: 200,
              returnPct: 25,
              pnlKrw: 675_000,
            },
          ],
          holdingsReturnPct: 25,
          holdingsPnlKrw: 675_000,
          fx: { usdKrw: 1350, jpyKrw: 9.2 },
          warnings: [],
        }),
      })
    );
  });

  it("보유 종목과 통화별 현금이 표시된다", () => {
    render(<HoldingsList snapshot={snapshot} />);
    expect(screen.getByText("SOXX")).toBeInTheDocument();
    expect(screen.getByText("005930.KS")).toBeInTheDocument();
    expect(screen.getByText(/반도체/)).toBeInTheDocument();
    expect(screen.getByText(/50,000,000/)).toBeInTheDocument();
    expect(screen.getByText(/\$12,000/)).toBeInTheDocument();
  });

  it("총자산 KRW가 로드되면 표시된다", async () => {
    render(<HoldingsList snapshot={snapshot} />);
    await waitFor(() => {
      expect(screen.getByTestId("portfolio-value-card")).toBeInTheDocument();
    });
    expect(screen.getByText("₩100,000,000")).toBeInTheDocument();
    expect(screen.getByText("+25.00%")).toBeInTheDocument();
  });
});
