import { describe, expect, it } from "vitest";
import { createEmptySnapshot } from "@/lib/agent/holdings-storage";
import { buildLocalBriefingSummary } from "./summary-local";

describe("buildLocalBriefingSummary", () => {
  it("보유가 있으면 3줄 이상 요약을 만든다", () => {
    const snap = createEmptySnapshot();
    snap.holdings.push({
      id: "1",
      ticker: "SOXX",
      quantity: 10,
      assetType: "etf",
      currency: "USD",
      sector: "semiconductor",
    });
    const summary = buildLocalBriefingSummary(snap, 10_000_000);
    expect(summary.lines.length).toBeGreaterThanOrEqual(3);
    expect(summary.disclaimer).toMatch(/투자 권유가 아닙니다/);
    expect(summary.lines.join(" ")).not.toMatch(/fixture/i);
  });
});
