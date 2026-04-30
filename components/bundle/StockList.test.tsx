import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as React from "react";
import { StockList } from "./StockList";
import type { Stock } from "@/types";

const sample: Stock[] = [
  { ticker: "AAPL", name: "Apple", description: "iPhone" },
  { ticker: "MSFT", name: "Microsoft", description: "Azure" },
  { ticker: "NVDA", name: "NVIDIA", description: "GPU" },
];

function Harness({ initial }: { initial: Stock[] }) {
  const [stocks, setStocks] = React.useState(initial);
  return <StockList stocks={stocks} onChange={setStocks} />;
}

describe("StockList", () => {
  it("종목 카드에 티커·회사명·설명을 표시한다", () => {
    render(<StockList stocks={sample} onChange={() => {}} />);
    expect(screen.getByText("AAPL")).toBeInTheDocument();
    expect(screen.getByText("Apple")).toBeInTheDocument();
    expect(screen.getByText("iPhone")).toBeInTheDocument();
  });

  it("제거 버튼 클릭 시 onChange가 해당 종목 빠진 배열로 호출된다", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<StockList stocks={sample} onChange={onChange} />);
    await user.click(screen.getByRole("button", { name: "AAPL 제거" }));
    expect(onChange).toHaveBeenCalledWith([sample[1], sample[2]]);
  });

  it("종목이 2개일 때 모든 제거 버튼이 비활성화된다", () => {
    render(<StockList stocks={sample.slice(0, 2)} onChange={() => {}} />);
    expect(screen.getByRole("button", { name: "AAPL 제거" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "MSFT 제거" })).toBeDisabled();
  });

  it("티커 input 입력 + 추가 버튼 클릭 시 onChange에 추가된다", async () => {
    const user = userEvent.setup();
    render(<Harness initial={sample} />);
    await user.type(screen.getByLabelText("티커 추가"), "tsla");
    await user.click(screen.getByRole("button", { name: /추가/ }));
    expect(screen.getByTestId("stock-TSLA")).toBeInTheDocument();
  });
});
