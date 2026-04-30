import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { act } from "react";
import { CreateBundleDialog } from "./CreateBundleDialog";
import type { Bundle } from "@/types";

function renderDialog(onSave = vi.fn(), open = true) {
  return render(
    <CreateBundleDialog open={open} onOpenChange={vi.fn()} onSave={onSave} />
  );
}

describe("CreateBundleDialog — 유효성 검사", () => {
  it("이름 미입력 시 저장하면 안내 메시지가 표시된다", async () => {
    renderDialog();
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /저장/ }));
    });
    expect(screen.getByText(/이름을 입력해 주세요/)).toBeInTheDocument();
  });

  it("종목이 1개 이하면 저장하면 안내 메시지가 표시된다", async () => {
    renderDialog();
    await act(async () => {
      fireEvent.change(screen.getByPlaceholderText(/번들 이름/), {
        target: { value: "내 번들" },
      });
    });
    // 종목 1개 추가
    await act(async () => {
      fireEvent.change(screen.getByPlaceholderText(/AAPL/), {
        target: { value: "NVDA" },
      });
      fireEvent.click(screen.getByRole("button", { name: /추가/ }));
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /저장/ }));
    });
    expect(screen.getByText(/종목을 2개 이상 추가해 주세요/)).toBeInTheDocument();
  });

  it("중복 ticker 추가 시 안내 메시지가 표시되고 목록이 변경되지 않는다", async () => {
    renderDialog();
    await act(async () => {
      fireEvent.change(screen.getByPlaceholderText(/AAPL/), {
        target: { value: "NVDA" },
      });
      fireEvent.click(screen.getByRole("button", { name: /추가/ }));
    });
    await act(async () => {
      fireEvent.change(screen.getByPlaceholderText(/AAPL/), {
        target: { value: "NVDA" },
      });
      fireEvent.click(screen.getByRole("button", { name: /추가/ }));
    });
    expect(screen.getByText(/이미 추가된 종목/)).toBeInTheDocument();
    // NVDA가 하나만 있어야 한다
    expect(screen.getAllByText("NVDA")).toHaveLength(1);
  });
});

describe("CreateBundleDialog — 저장", () => {
  it("이름·카테고리·종목 2개 입력 후 저장하면 onSave가 올바른 데이터로 호출된다", async () => {
    const onSave = vi.fn();
    renderDialog(onSave);

    await act(async () => {
      fireEvent.change(screen.getByPlaceholderText(/번들 이름/), {
        target: { value: "내 테스트 번들" },
      });
    });
    // 종목 2개 추가
    for (const ticker of ["AAPL", "MSFT"]) {
      await act(async () => {
        fireEvent.change(screen.getByPlaceholderText(/AAPL/), {
          target: { value: ticker },
        });
        fireEvent.click(screen.getByRole("button", { name: /추가/ }));
      });
    }
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /저장/ }));
    });

    expect(onSave).toHaveBeenCalledTimes(1);
    const saved = onSave.mock.calls[0][0] as Bundle;
    expect(saved.name).toBe("내 테스트 번들");
    expect(saved.stocks.map((s) => s.ticker)).toEqual(["AAPL", "MSFT"]);
    expect(saved.isCustom).toBe(true);
  });
});
