import { describe, expect, it } from "vitest";
import { formatEventAlert } from "./format-event";
import { BRIEFING_DISCLAIMER } from "@/services/briefing/types";

describe("formatEventAlert", () => {
  it("이벤트 제목·요약·근거·링크·면책을 포함한다", () => {
    const alert = formatEventAlert({
      title: "CPI 발표",
      bullets: ["요약 1", "요약 2", "요약 3"],
      rationale: "환전 검토",
      reportUrl: "https://example.com/agent/report/2026-07-04",
    });

    expect(alert.subject).toMatch(/CPI 발표/);
    expect(alert.text).toMatch(/\[이벤트\] CPI 발표/);
    expect(alert.text).toMatch(/요약 1/);
    expect(alert.text).toMatch(/근거: 환전 검토/);
    expect(alert.text).toMatch(/https:\/\/example.com\/agent\/report/);
    expect(alert.text).toContain(BRIEFING_DISCLAIMER);
  });
});
