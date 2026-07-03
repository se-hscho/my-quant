import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SectorTagDialog } from "./SectorTagDialog";

describe("SectorTagDialog", () => {
  it("자동 분류 실패 티커에 섹터 선택 UI가 표시된다", () => {
    render(
      <SectorTagDialog
        open
        ticker="MYSTERY"
        onOpenChange={vi.fn()}
        onConfirm={vi.fn()}
      />
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText(/MYSTERY/)).toBeInTheDocument();
    expect(screen.getByLabelText("섹터")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "확인" })).toBeInTheDocument();
  });

  it("섹터 선택 후 확인하면 onConfirm이 호출된다", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(
      <SectorTagDialog
        open
        ticker="MYSTERY"
        onOpenChange={vi.fn()}
        onConfirm={onConfirm}
      />
    );

    await user.selectOptions(screen.getByLabelText("섹터"), "technology");
    await user.click(screen.getByRole("button", { name: "확인" }));

    expect(onConfirm).toHaveBeenCalledWith("technology", "US");
  });

  it("지역을 추론할 수 없으면 지역 선택 UI가 표시된다", () => {
    render(
      <SectorTagDialog
        open
        ticker="MYSTERY"
        onOpenChange={vi.fn()}
        onConfirm={vi.fn()}
      />
    );
    expect(screen.getByLabelText("지역")).toBeInTheDocument();
  });

  it("KR 티커는 지역 선택 없이 확인 가능하다", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(
      <SectorTagDialog
        open
        ticker="999999.KS"
        onOpenChange={vi.fn()}
        onConfirm={onConfirm}
      />
    );

    expect(screen.queryByLabelText("지역")).not.toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText("섹터"), "consumer");
    await user.click(screen.getByRole("button", { name: "확인" }));
    expect(onConfirm).toHaveBeenCalledWith("consumer", "KR");
  });
});
