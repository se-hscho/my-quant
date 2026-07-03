import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { PortfolioValueCard } from "./PortfolioValueCard";

describe("PortfolioValueCard", () => {
  it("로딩 중 placeholder", () => {
    render(<PortfolioValueCard valuation={null} loading />);
    expect(screen.getByText(/시세 로딩 중/)).toBeInTheDocument();
  });

  it("총자산 KRW 표시", () => {
    render(
      <PortfolioValueCard
        valuation={{
          totalKrw: 12_345_678,
          cashKrw: 1_000_000,
          holdingsKrw: 11_345_678,
          holdings: [],
          fx: { usdKrw: 1350, jpyKrw: 9.2 },
          warnings: [],
        }}
      />
    );
    expect(screen.getByText(/₩12,345,678/)).toBeInTheDocument();
  });
});
