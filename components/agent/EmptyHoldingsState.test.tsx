import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { EmptyHoldingsState } from "./EmptyHoldingsState";

describe("EmptyHoldingsState", () => {
  it("보유 미등록 안내 문구가 표시된다", () => {
    render(<EmptyHoldingsState />);
    expect(screen.getByText("보유 자산을 등록해주세요")).toBeInTheDocument();
    expect(
      screen.getByText(/티커·수량·통화별 현금을 입력하면/i)
    ).toBeInTheDocument();
  });

  it("보유 편집 화면으로 이동하는 링크가 있다", () => {
    render(<EmptyHoldingsState />);
    const link = screen.getByRole("link", { name: "보유 자산 등록하기" });
    expect(link).toHaveAttribute("href", "/agent/holdings");
  });
});
