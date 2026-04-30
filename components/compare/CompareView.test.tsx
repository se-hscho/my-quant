import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CompareView } from "./CompareView";
import type { PortfolioResult } from "@/types";

function make(id: string, name: string, ret: number): PortfolioResult {
  return {
    id,
    bundleId: "b",
    bundleName: name,
    method: "max-sharpe",
    tickers: ["A", "B"],
    weights: { A: 0.6, B: 0.4 },
    metrics: { annualReturn: ret, volatility: 0.2, sharpe: 0.5, mdd: -0.3 },
    frontier: [],
    savedAt: "2024-01-01T00:00:00Z",
  };
}

describe("CompareView", () => {
  it("결과 누락 시 안내 메시지를 보여준다", () => {
    render(<CompareView a={null} b={make("r2", "B", 0.1)} />);
    expect(screen.getByTestId("compare-missing")).toBeInTheDocument();
  });

  it("두 결과의 핵심 지표가 나란히 표시된다", () => {
    render(
      <CompareView a={make("r1", "AI 번들", 0.12)} b={make("r2", "BigTech", 0.08)} />
    );
    expect(screen.getAllByText("AI 번들").length).toBeGreaterThan(0);
    expect(screen.getAllByText("BigTech").length).toBeGreaterThan(0);
    expect(screen.getByText("12.00%")).toBeInTheDocument();
    expect(screen.getByText("8.00%")).toBeInTheDocument();
    expect(screen.getByText("연환산 수익률")).toBeInTheDocument();
    expect(screen.getByText("변동성")).toBeInTheDocument();
    expect(screen.getByText("샤프비율")).toBeInTheDocument();
    expect(screen.getByText("MDD")).toBeInTheDocument();
  });
});
