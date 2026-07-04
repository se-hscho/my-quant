import { describe, expect, it } from "vitest";
import {
  buildReportExecutiveSummary,
  buildReportToc,
  REPORT_CHAPTERS,
} from "@/lib/agent/report-outline";
import type { Briefing } from "@/services/briefing/types";
import { BRIEFING_DISCLAIMER } from "@/services/briefing/types";

function mockBriefing(overrides: Partial<Briefing> = {}): Briefing {
  return {
    date: "2026-07-04",
    summaryLines: ["결론 A", "결론 B"],
    totalAssetsKrw: 20_000_000,
    cash: { krw: 20_000_000, usd: 0, jpy: 0 },
    sectorTop3: [
      { sector: "semiconductor", label: "반도체", weightPct: 0, flowScore: 0.82 },
    ],
    scenarioComparison: [],
    fxRebalanceLine: "환전 관망",
    scenarios: [
      {
        id: 0,
        label: "유지",
        expectedReturn: 1,
        expectedVolatility: 2,
        assetReturn: 1,
        fxImpact: 0,
        weightsBefore: { CASH: 100 },
        weightsAfter: { CASH: 100 },
        cashAfter: { krw: 0, usd: 0, jpy: 0 },
        playbook: [],
      },
      {
        id: 1,
        label: "Follow",
        expectedReturn: 6,
        expectedVolatility: 14,
        assetReturn: 4,
        fxImpact: 2,
        weightsBefore: { CASH: 100 },
        weightsAfter: { CASH: 70, SOXX: 30 },
        cashAfter: { krw: 0, usd: 0, jpy: 0 },
        playbook: [{ order: 1, action: "buy", ticker: "SOXX", currency: "USD" }],
      },
    ],
    sections: {
      portfolio: {
        returns: { d1: 0, d7: 0, m1: 0, q1: 0, ytd: 0 },
        caption: "test",
        help: [],
      },
      fx: {
        usdKrw: 1350,
        jpyKrw: 9,
        trend: [],
        rebalanceTiming: "관망",
        rebalanceAmountKrw: 0,
        rebalanceAmountUsd: 0,
        rationale: [],
      },
      smartMoney: {
        foreignNetBuyBn: 0.5,
        institutionNetBuyBn: -0.2,
        sectorFlows: [],
        institutionalLens: [],
      },
      sectorFlows: { rows: [], inflowNote: "유입", outflowNote: "유출" },
      context: { items: [] },
      events: { timeline: [] },
      institutional: { paragraphs: ["기관 렌즈"] },
      analysisGuide: { intro: "분석", layers: [] },
      recommendations: { rows: [] },
      analyst: { reports: [] },
    },
    disclaimer: BRIEFING_DISCLAIMER,
    status: "complete",
    ...overrides,
  };
}

describe("buildReportToc", () => {
  it("기본 7장 + diff 있으면 8장", () => {
    expect(buildReportToc(false, false)).toHaveLength(7);
    expect(buildReportToc(true, false)).toHaveLength(8);
    expect(buildReportToc(false, false)[0].id).toBe(REPORT_CHAPTERS.summary.id);
  });
});

describe("buildReportExecutiveSummary", () => {
  it("thesis·conclusions·metrics를 생성한다", () => {
    const summary = buildReportExecutiveSummary(mockBriefing());
    expect(summary.thesis).toMatch(/반도체/);
    expect(summary.conclusions).toHaveLength(2);
    expect(summary.keyMetrics.some((m) => m.label === "총자산")).toBe(true);
    expect(summary.recommendedScenario).toMatch(/\(1안\)/);
  });

  it("신규 배분 모드 thesis", () => {
    const summary = buildReportExecutiveSummary(
      mockBriefing({
        sections: {
          ...mockBriefing().sections,
          investmentDirection: {
            mode: "deployment",
            headline: "2천만원 배분",
            totalDeployableKrw: 20_000_000,
            marketNarrative: [],
            policyNarrative: [],
            recommendedScenarioId: 1,
            recommendedScenarioLabel: "Follow",
            recommendedReason: "균등 분할",
            combinations: [],
            evidenceLinks: [],
          },
        },
      })
    );
    expect(summary.thesis).toMatch(/현금/);
  });
});
