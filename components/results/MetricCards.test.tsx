import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MetricCards } from "./MetricCards";

describe("MetricCards", () => {
  it("4개 지표 카드를 모두 렌더링한다", () => {
    render(
      <MetricCards
        metrics={{
          annualReturn: 0.123,
          volatility: 0.18,
          sharpe: 0.7,
          mdd: -0.25,
        }}
      />
    );
    expect(screen.getByTestId("metric-annualReturn")).toBeInTheDocument();
    expect(screen.getByTestId("metric-volatility")).toBeInTheDocument();
    expect(screen.getByTestId("metric-sharpe")).toBeInTheDocument();
    expect(screen.getByTestId("metric-mdd")).toBeInTheDocument();
  });

  it("각 카드에 InfoTooltip 버튼('? 설명')이 포함된다", () => {
    render(
      <MetricCards
        metrics={{ annualReturn: 0, volatility: 0, sharpe: 0, mdd: 0 }}
      />
    );
    expect(screen.getByRole("button", { name: /연환산 수익률 설명/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /변동성 설명/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /샤프비율 설명/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /MDD 설명/ })).toBeInTheDocument();
  });

  it("값을 % 또는 숫자로 포맷한다", () => {
    render(
      <MetricCards
        metrics={{ annualReturn: 0.1234, volatility: 0.2, sharpe: 1.5, mdd: -0.3 }}
      />
    );
    expect(screen.getByText("12.34%")).toBeInTheDocument();
    expect(screen.getByText("20.00%")).toBeInTheDocument();
    expect(screen.getByText("1.50")).toBeInTheDocument();
    expect(screen.getByText("-30.00%")).toBeInTheDocument();
  });
});
