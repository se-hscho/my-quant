import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OptimizationPanel } from "./OptimizationPanel";

describe("OptimizationPanel", () => {
  it("3개 최적화 방법 라디오와 실행 버튼을 표시한다", () => {
    render(
      <OptimizationPanel
        method="max-sharpe"
        onMethodChange={() => {}}
        onRun={() => {}}
      />
    );
    expect(screen.getByRole("radio", { name: "Max Sharpe" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Min Variance" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Risk Parity" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "최적화 실행" })
    ).toBeInTheDocument();
  });

  it("라디오 변경 시 onMethodChange를 호출한다", async () => {
    const user = userEvent.setup();
    const cb = vi.fn();
    render(
      <OptimizationPanel
        method="max-sharpe"
        onMethodChange={cb}
        onRun={() => {}}
      />
    );
    await user.click(screen.getByRole("radio", { name: "Min Variance" }));
    expect(cb).toHaveBeenCalledWith("min-variance");
  });

  it("실행 버튼 클릭 시 onRun을 호출한다", async () => {
    const user = userEvent.setup();
    const onRun = vi.fn();
    render(
      <OptimizationPanel
        method="max-sharpe"
        onMethodChange={() => {}}
        onRun={onRun}
      />
    );
    await user.click(screen.getByRole("button", { name: "최적화 실행" }));
    expect(onRun).toHaveBeenCalled();
  });
});
