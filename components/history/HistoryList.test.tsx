import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HistoryList } from "./HistoryList";
import type { PortfolioResult } from "@/types";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

const sample: PortfolioResult[] = [
  {
    id: "r1",
    bundleId: "b1",
    bundleName: "AI 번들",
    method: "max-sharpe",
    tickers: ["NVDA"],
    weights: { NVDA: 1 },
    metrics: { annualReturn: 0.1, volatility: 0.2, sharpe: 0.5, mdd: -0.3 },
    frontier: [],
    savedAt: "2024-03-10T10:00:00Z",
  },
  {
    id: "r2",
    bundleId: "b2",
    bundleName: "BigTech",
    method: "min-variance",
    tickers: ["MSFT"],
    weights: { MSFT: 1 },
    metrics: { annualReturn: 0.08, volatility: 0.15, sharpe: 0.5, mdd: -0.2 },
    frontier: [],
    savedAt: "2024-04-10T10:00:00Z",
  },
];

describe("HistoryList", () => {
  it("결과가 없으면 안내 메시지를 표시한다", () => {
    render(
      <HistoryList results={[]} selected={[]} onToggle={() => {}} canCompare={false} />
    );
    expect(screen.getByText(/저장된 결과가 없습니다/)).toBeInTheDocument();
  });

  it("각 항목에 번들명·방법·저장 일시·체크박스가 표시된다", () => {
    render(
      <HistoryList
        results={sample}
        selected={[]}
        onToggle={() => {}}
        canCompare={false}
      />
    );
    expect(screen.getByText("AI 번들")).toBeInTheDocument();
    expect(screen.getByText("BigTech")).toBeInTheDocument();
    expect(screen.getByText("Max Sharpe")).toBeInTheDocument();
    expect(screen.getByText("Min Variance")).toBeInTheDocument();
    expect(screen.getByLabelText("AI 번들 선택")).toBeInTheDocument();
  });

  it("체크박스 토글 시 onToggle이 호출된다", async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    render(
      <HistoryList
        results={sample}
        selected={[]}
        onToggle={onToggle}
        canCompare={false}
      />
    );
    await user.click(screen.getByLabelText("AI 번들 선택"));
    expect(onToggle).toHaveBeenCalledWith("r1");
  });

  it("canCompare=true 일 때 비교하기 버튼이 활성화된다", () => {
    const { rerender } = render(
      <HistoryList
        results={sample}
        selected={["r1"]}
        onToggle={() => {}}
        canCompare={false}
      />
    );
    expect(screen.getByRole("button", { name: "비교하기" })).toBeDisabled();
    rerender(
      <HistoryList
        results={sample}
        selected={["r1", "r2"]}
        onToggle={() => {}}
        canCompare
      />
    );
    expect(screen.getByRole("button", { name: "비교하기" })).not.toBeDisabled();
  });
});
