import { describe, expect, it } from "vitest";
import type { Briefing } from "@/services/briefing/types";
import { BRIEFING_DISCLAIMER } from "@/services/briefing/types";
import { formatMorningSummary } from "./format-summary";

function mockBriefing(): Briefing {
  return {
    date: "2026-07-04",
    summaryLines: ["요약 A", "요약 B"],
    totalAssetsKrw: 10_000_000,
    cash: { krw: 0, usd: 0, jpy: 0 },
    sectorTop3: [],
    scenarioComparison: [
      { id: 0, label: "유지", expectedReturn: 1, expectedVolatility: 2 },
      { id: 1, label: "Follow", expectedReturn: 3, expectedVolatility: 4 },
    ],
    fxRebalanceLine: "환전",
    scenarios: [],
    sections: {} as Briefing["sections"],
    disclaimer: BRIEFING_DISCLAIMER,
    status: "complete",
  };
}

describe("formatMorningSummary", () => {
  it("아침 요약·시나리오·링크·면책을 포함한다", () => {
    const url = "https://example.com/agent/report/2026-07-04";
    const formatted = formatMorningSummary(mockBriefing(), url);

    expect(formatted.subject).toMatch(/2026-07-04/);
    expect(formatted.text).toMatch(/요약 A/);
    expect(formatted.text).toMatch(/안 1 Follow/);
    expect(formatted.text).toMatch(url);
    expect(formatted.text).toContain(BRIEFING_DISCLAIMER);
    expect(formatted.html).toMatch(/href="https:\/\/example.com/);
  });
});
