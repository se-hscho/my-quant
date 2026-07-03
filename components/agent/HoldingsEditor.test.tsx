import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HoldingsEditor } from "./HoldingsEditor";
import { createEmptySnapshot } from "@/lib/agent/holdings-storage";

describe("HoldingsEditor", () => {
  it("티커·수량·자산 유형·결제 통화 입력 폼이 있다", () => {
    render(
      <HoldingsEditor draft={createEmptySnapshot()} onDraftChange={vi.fn()} />
    );
    expect(screen.getByLabelText("티커")).toBeInTheDocument();
    expect(screen.getByLabelText("수량")).toBeInTheDocument();
    expect(screen.getByLabelText("자산 유형")).toBeInTheDocument();
    expect(screen.getByLabelText("결제 통화")).toBeInTheDocument();
  });

  it("KRW·USD·JPY 현금을 각각 입력할 수 있다", () => {
    render(
      <HoldingsEditor draft={createEmptySnapshot()} onDraftChange={vi.fn()} />
    );
    expect(screen.getByLabelText("KRW")).toBeInTheDocument();
    expect(screen.getByLabelText("USD")).toBeInTheDocument();
    expect(screen.getByLabelText("JPY")).toBeInTheDocument();
  });

  it("종목 추가 시 onDraftChange에 보유 종목이 포함된다", async () => {
    const user = userEvent.setup();
    const onDraftChange = vi.fn();
    render(
      <HoldingsEditor draft={createEmptySnapshot()} onDraftChange={onDraftChange} />
    );

    await user.type(screen.getByLabelText("티커"), "SOXX");
    await user.type(screen.getByLabelText("수량"), "10");
    await user.click(screen.getByRole("button", { name: /종목 추가/i }));

    expect(onDraftChange).toHaveBeenCalled();
    const last = onDraftChange.mock.calls.at(-1)?.[0];
    expect(last.holdings).toHaveLength(1);
    expect(last.holdings[0].ticker).toBe("SOXX");
    expect(last.holdings[0].quantity).toBe(10);
  });
});
