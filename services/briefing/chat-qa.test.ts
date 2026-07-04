import { describe, expect, it } from "vitest";
import { answerBriefingQuestion } from "./chat-qa";
import type { Briefing } from "./types";
import { BRIEFING_DISCLAIMER } from "./types";
import { buildScenarios } from "./scenarios";
import { createEmptySnapshot } from "@/lib/agent/holdings-storage";

function mockBriefing(): Briefing {
  const snap = createEmptySnapshot();
  snap.holdings.push({
    id: "1",
    ticker: "SOXX",
    quantity: 10,
    assetType: "etf",
    currency: "USD",
  });
  const valuation = {
    totalKrw: 10_000_000,
    cashKrw: 2_000_000,
    holdingsKrw: 8_000_000,
    holdings: [
      {
        id: "1",
        ticker: "SOXX",
        quantity: 10,
        currency: "USD" as const,
        price: 800_000,
        valueNative: 800_000,
        valueKrw: 8_000_000,
      },
    ],
    fx: { usdKrw: 1350, jpyKrw: 9 },
    warnings: [],
  };
  const scenarios = buildScenarios(snap, valuation);
  return {
    date: "2026-07-03",
    summaryLines: ["line1", "line2", "line3"],
    totalAssetsKrw: 10_000_000,
    cash: snap.cash,
    sectorTop3: [{ sector: "semiconductor", label: "반도체", weightPct: 50, flowScore: 0.8 }],
    scenarioComparison: scenarios.map((s) => ({
      id: s.id,
      label: s.label,
      expectedReturn: s.expectedReturn,
      expectedVolatility: s.expectedVolatility,
    })),
    fxRebalanceLine: "환전 검토",
    scenarios,
    sections: {
      portfolio: {
        returns: { d1: 0, d7: 0, m1: 0, q1: 0, ytd: 0 },
        caption: "c",
        help: ["a", "b"],
      },
      fx: {
        usdKrw: 1350,
        jpyKrw: 9.2,
        trend: [],
        rebalanceTiming: "이번 주",
        rebalanceAmountKrw: 0,
        rebalanceAmountUsd: 0,
        rationale: ["r1", "r2"],
      },
      smartMoney: {
        foreignNetBuyBn: 1,
        institutionNetBuyBn: -1,
        sectorFlows: [],
        institutionalLens: [],
      },
      sectorFlows: { rows: [], inflowNote: "in", outflowNote: "out" },
      context: { items: [] },
      events: { timeline: [] },
      institutional: { paragraphs: [] },
      analysisGuide: { intro: "test", layers: [] },
      recommendations: { rows: [] },
    },
    disclaimer: BRIEFING_DISCLAIMER,
    status: "complete",
  };
}

describe("answerBriefingQuestion", () => {
  it("안 1 설명에 Follow 포함", () => {
    const reply = answerBriefingQuestion("안 1 설명해줘", mockBriefing());
    expect(reply).toMatch(/Follow|안 1/);
  });
});
