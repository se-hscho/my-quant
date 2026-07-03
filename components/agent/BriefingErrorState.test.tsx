import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BriefingErrorState } from "./BriefingErrorState";

describe("BriefingErrorState", () => {
  it("재시도 버튼", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(<BriefingErrorState onRetry={onRetry} />);
    await user.click(screen.getByRole("button", { name: "재시도" }));
    expect(onRetry).toHaveBeenCalled();
  });
});
