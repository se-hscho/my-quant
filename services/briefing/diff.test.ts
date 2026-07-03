import { describe, expect, it } from "vitest";
import type { Briefing } from "./types";
import { diffBriefings } from "./diff";

function minimalBriefing(overrides: Partial<Briefing> = {}): Briefing {
  return {
    date: "2026-07-03",
    summaryLines: ["line"],
    totalAssetsKrw: 1,
    cash: { krw: 0, usd: 0, jpy: 0 },
    sectorTop3: [],
    scenarioComparison: [],
    fxRebalanceLine: "환전 관망",
    scenarios: [
      {
        id: 1,
        label: "Follow",
        expectedReturn: 6,
        expectedVolatility: 14,
        assetReturn: 4,
        fxImpact: 2,
        weightsBefore: {},
        weightsAfter: {},
        cashAfter: { krw: 0, usd: 0, jpy: 0 },
        playbook: [],
      },
    ],
    sections: {} as Briefing["sections"],
    disclaimer: "",
    status: "complete",
    ...overrides,
  };
}

describe("diffBriefings", () => {
  it("전일 없으면 최초 생성 diff", () => {
    const diff = diffBriefings(null, minimalBriefing());
    expect(diff?.rows[0].after).toBe("최초 생성");
  });

  it("Follow 수익률 변경 시 diff 행 추가", () => {
    const prev = minimalBriefing({
      scenarios: [
        {
          ...minimalBriefing().scenarios[0],
          expectedReturn: 5,
        },
      ],
    });
    const curr = minimalBriefing({
      scenarios: [
        {
          ...minimalBriefing().scenarios[0],
          expectedReturn: 7,
        },
      ],
    });
    const diff = diffBriefings(prev, curr);
    expect(diff?.rows.some((r) => r.field.includes("안 1"))).toBe(true);
  });
});
