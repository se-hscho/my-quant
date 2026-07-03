import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { HoldingsList } from "./HoldingsList";
import type { HoldingsSnapshot } from "@/types/agent";

const snapshot: HoldingsSnapshot = {
  holdings: [
    {
      id: "1",
      ticker: "SOXX",
      quantity: 10,
      assetType: "etf",
      currency: "USD",
      sector: "semiconductor",
    },
    {
      id: "2",
      ticker: "005930.KS",
      quantity: 50,
      assetType: "stock",
      currency: "KRW",
    },
  ],
  cash: { krw: 50_000_000, usd: 12_000, jpy: 0 },
  updatedAt: "2026-07-03T00:00:00.000Z",
};

describe("HoldingsList", () => {
  it("보유 종목과 통화별 현금이 표시된다", () => {
    render(<HoldingsList snapshot={snapshot} />);
    expect(screen.getByText("SOXX")).toBeInTheDocument();
    expect(screen.getByText("005930.KS")).toBeInTheDocument();
    expect(screen.getByText("반도체")).toBeInTheDocument();
    expect(screen.getByText(/50,000,000/)).toBeInTheDocument();
    expect(screen.getByText(/\$12,000/)).toBeInTheDocument();
  });

  it("총자산 영역에 시세 로딩 중이 표시된다", () => {
    render(<HoldingsList snapshot={snapshot} />);
    expect(screen.getByText("시세 로딩 중")).toBeInTheDocument();
  });
});
