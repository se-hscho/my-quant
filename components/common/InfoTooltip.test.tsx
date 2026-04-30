import { describe, it, expect } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { InfoTooltip } from "./InfoTooltip";

describe("InfoTooltip", () => {
  it("'?' 아이콘 버튼이 렌더된다", () => {
    render(<InfoTooltip label="샤프비율" description="위험 대비 수익률" />);
    expect(
      screen.getByRole("button", { name: /샤프비율 설명/ })
    ).toBeInTheDocument();
  });

  it("hover 시 설명 텍스트가 보이고, 벗어나면 사라진다", async () => {
    const user = userEvent.setup();
    render(<InfoTooltip label="샤프비율" description="위험 대비 수익률" />);
    const trigger = screen.getByRole("button", { name: /샤프비율 설명/ });

    await user.hover(trigger);
    await waitFor(() =>
      expect(screen.getByText("위험 대비 수익률")).toBeInTheDocument()
    );

    await user.unhover(trigger);
    await waitFor(() =>
      expect(screen.queryByText("위험 대비 수익률")).not.toBeInTheDocument()
    );
  });
});
