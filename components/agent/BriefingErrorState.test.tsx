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

  it("구조화 오류 코드·메시지·상세를 표시한다", () => {
    render(
      <BriefingErrorState
        onRetry={() => {}}
        error={{
          code: "FX_OR_PRICE_UNAVAILABLE",
          message: "시세·환율 데이터를 가져오지 못했습니다",
          detail: "GET: complete 브리핑 없음 → POST HTTP 503: FX or price data unavailable",
          httpStatus: 503,
        }}
      />
    );
    const detail = screen.getByTestId("briefing-error-detail");
    expect(detail).toHaveTextContent("FX_OR_PRICE_UNAVAILABLE");
    expect(detail).toHaveTextContent("HTTP 503");
    expect(detail).toHaveTextContent("시세·환율");
    expect(detail).toHaveTextContent("FX or price data unavailable");
  });
});
