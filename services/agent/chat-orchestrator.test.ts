import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { Briefing } from "@/services/briefing/types";
import { BRIEFING_DISCLAIMER } from "@/services/briefing/types";
import { buildScenarios } from "@/services/briefing/scenarios";
import { createEmptySnapshot } from "@/lib/agent/holdings-storage";
import { processAgentChat } from "./chat-orchestrator";

vi.mock("@/services/ai/gemini", () => ({
  isGeminiConfigured: vi.fn(),
  isBlockedGeminiModel: (model: string) =>
    model.startsWith("gemini-1.5") || model.startsWith("gemini-1.0"),
  isTransientGeminiError: (error: string) =>
    /HTTP 503|HTTP 429|high demand|overloaded/i.test(error),
  GEMINI_DEFAULT_MODEL: "gemini-2.5-flash",
}));

vi.mock("@/services/ai/llm-rate-limit", () => ({
  canInvokeLlm: vi.fn(() => true),
  recordLlmCall: vi.fn(),
  getLlmRateLimitStatus: vi.fn(() => ({
    allowed: true,
    remaining: 8,
    retryAfterMs: 0,
  })),
}));

vi.mock("@/services/agent/chat-llm", () => ({
  normalizeChatInputWithLlm: vi.fn(),
}));

import { isGeminiConfigured } from "@/services/ai/gemini";
import { canInvokeLlm } from "@/services/ai/llm-rate-limit";
import { normalizeChatInputWithLlm } from "@/services/agent/chat-llm";

const mockConfigured = vi.mocked(isGeminiConfigured);
const mockCanInvoke = vi.mocked(canInvokeLlm);
const mockNormalize = vi.mocked(normalizeChatInputWithLlm);

const soxxAction = {
  type: "add_holding" as const,
  ticker: "SOXX",
  quantity: 10,
  assetType: "etf" as const,
  currency: "USD" as const,
};

function mockBriefingForChat(): Briefing {
  const snap = createEmptySnapshot();
  snap.holdings.push({
    id: "1",
    ticker: "SOXX",
    quantity: 10,
    assetType: "etf",
    currency: "USD",
  });
  const scenarios = buildScenarios(snap, 10_000_000, 1350);
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
        interpretation: ["a", "b"],
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
      recommendations: { rows: [] },
    },
    disclaimer: BRIEFING_DISCLAIMER,
    status: "complete",
  };
}

describe("processAgentChat", () => {
  beforeEach(() => {
    mockConfigured.mockReset();
    mockCanInvoke.mockReset();
    mockNormalize.mockReset();
    mockCanInvoke.mockReturnValue(true);
  });

  it("규칙으로 인식되는 명령은 LLM을 호출하지 않는다", async () => {
    mockConfigured.mockReturnValue(true);

    const result = await processAgentChat({ message: "SOXX 10주 등록" });
    expect(mockNormalize).not.toHaveBeenCalled();
    expect(result.actions[0]).toMatchObject({ ticker: "SOXX", quantity: 10 });
    expect(result.llmStatus).toBe("skipped");
  });

  it("삼전·반도체 별칭도 LLM 없이 처리한다", async () => {
    mockConfigured.mockReturnValue(true);

    const r1 = await processAgentChat({ message: "삼전 10주" });
    expect(mockNormalize).not.toHaveBeenCalled();
    expect(r1.actions[0]).toMatchObject({ ticker: "005930.KS", quantity: 10 });

    const r2 = await processAgentChat({ message: "반도체 etf 10주 샀어" });
    expect(r2.actions[0]).toMatchObject({ ticker: "SOXX", quantity: 10 });
  });

  it("규칙 실패 시 LLM을 호출한다", async () => {
    mockConfigured.mockReturnValue(true);
    mockNormalize.mockResolvedValue({
      normalizedCommand: "SOXX 10주 등록",
      actions: [soxxAction],
      confidence: "high",
    });

    const result = await processAgentChat({
      message: "요즘 핫한 반도체 테마 10주 사고 싶어",
    });
    expect(mockNormalize).toHaveBeenCalled();
    expect(result.llmStatus).toBe("active");
  });

  it("도움말은 LLM 없이 처리한다", async () => {
    mockConfigured.mockReturnValue(true);
    const result = await processAgentChat({ message: "도움말" });
    expect(mockNormalize).not.toHaveBeenCalled();
    expect(result.llmStatus).toBe("skipped");
  });

  it("브리핑 맥락에서 안 1 설명은 playbook 답변을 반환한다", async () => {
    mockConfigured.mockReturnValue(true);

    const result = await processAgentChat({
      message: "안 1 설명해줘",
      briefing: mockBriefingForChat(),
    });

    expect(mockNormalize).not.toHaveBeenCalled();
    expect(result.llmStatus).toBe("skipped");
    expect(result.reply).toMatch(/Playbook:/);
    expect(result.reply).toMatch(/안 1|Follow/);
    expect(result.reply).toMatch(/예상 수익/);
  });

  it("LLM 한도 초과 시 rate_limited", async () => {
    mockConfigured.mockReturnValue(true);
    mockCanInvoke.mockReturnValue(false);

    const result = await processAgentChat({ message: "이상한 말만 있음" });
    expect(mockNormalize).not.toHaveBeenCalled();
    expect(result.llmStatus).toBe("rate_limited");
    expect(result.reply).toMatch(/무료 한도/);
  });

  it("LLM API 오류 시 원인을 답변에 포함한다", async () => {
    mockConfigured.mockReturnValue(true);
    mockNormalize.mockResolvedValue({
      normalizedCommand: null,
      actions: [],
      error: "gemini-2.0-flash: API key invalid",
    });

    const result = await processAgentChat({ message: "이상한 자연어 문장만 있음" });
    expect(result.llmStatus).toBe("failed");
    expect(result.reply).toMatch(/API key invalid|AI 해석에 실패/);
  });

  it("GEMINI 미설정 시 규칙 파서만 사용한다", async () => {
    mockConfigured.mockReturnValue(false);
    const result = await processAgentChat({ message: "이상한 말" });
    expect(mockNormalize).not.toHaveBeenCalled();
    expect(result.llmStatus).toBe("unconfigured");
  });
});
