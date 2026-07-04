import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { PortfolioCashRow } from "./PortfolioValueCard";

describe("PortfolioCashRow", () => {
  it("0원 통화는 표시하지 않는다", () => {
    render(<PortfolioCashRow krw={8_000_000} usd={3_500} jpy={0} />);
    const row = screen.getByTestId("portfolio-cash-row");
    expect(row.textContent).toMatch(/₩/);
    expect(row.textContent).toMatch(/\$/);
    expect(row.textContent).not.toMatch(/¥/);
  });

  it("모두 0이면 현금 없음", () => {
    render(<PortfolioCashRow krw={0} usd={0} jpy={0} />);
    expect(screen.getByText("현금 없음")).toBeInTheDocument();
  });
});
