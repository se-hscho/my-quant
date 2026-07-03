import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { processAgentChat } from "./chat-orchestrator";

vi.mock("@/services/ai/gemini", () => ({
  isGeminiConfigured: vi.fn(),
  isBlockedGeminiModel: (model: string) =>
    model.startsWith("gemini-1.5") || model.startsWith("gemini-1.0"),
  isTransientGeminiError: (error: string) =>
    /HTTP 503|HTTP 429|high demand|overloaded/i.test(error),
  GEMINI_DEFAULT_MODEL: "gemini-2.5-flash",
}));

vi.mock("@/services/agent/chat-llm", () => ({
  normalizeChatInputWithLlm: vi.fn(),
}));

import { isGeminiConfigured } from "@/services/ai/gemini";
import { normalizeChatInputWithLlm } from "@/services/agent/chat-llm";

const mockConfigured = vi.mocked(isGeminiConfigured);
const mockNormalize = vi.mocked(normalizeChatInputWithLlm);

const soxxAction = {
  type: "add_holding" as const,
  ticker: "SOXX",
  quantity: 10,
  assetType: "etf" as const,
  currency: "USD" as const,
};

describe("processAgentChat", () => {
  const originalKey = process.env.GEMINI_API_KEY;

  afterEach(() => {
    if (originalKey === undefined) {
      delete process.env.GEMINI_API_KEY;
    } else {
      process.env.GEMINI_API_KEY = originalKey;
    }
  });

  beforeEach(() => {
    mockConfigured.mockReset();
    mockNormalize.mockReset();
  });

  it("Gemini 설정 시 등록 명령은 LLM actions로 처리한다", async () => {
    mockConfigured.mockReturnValue(true);
    mockNormalize.mockResolvedValue({
      normalizedCommand: "SOXX 10주 등록",
      actions: [soxxAction],
      confidence: "high",
    });

    const result = await processAgentChat({ message: "SOXX 10주 등록" });
    expect(mockNormalize).toHaveBeenCalledWith("SOXX 10주 등록");
    expect(result.actions[0]).toMatchObject({ ticker: "SOXX", quantity: 10 });
    expect(result.llmStatus).toBe("active");
    expect(result.usedLlm).toBe(true);
  });

  it("자연어 등록도 LLM actions를 직접 사용한다", async () => {
    mockConfigured.mockReturnValue(true);
    mockNormalize.mockResolvedValue({
      normalizedCommand: "SOXX 10주 등록",
      actions: [soxxAction],
      confidence: "high",
    });

    const result = await processAgentChat({
      message: "반도체 etf 10주 샀어",
    });

    expect(mockNormalize).toHaveBeenCalledWith("반도체 etf 10주 샀어");
    expect(result.actions[0]).toMatchObject({ ticker: "SOXX", quantity: 10 });
    expect(result.llmStatus).toBe("active");
  });

  it("도움말은 LLM 없이 규칙 파서만 사용한다", async () => {
    mockConfigured.mockReturnValue(true);

    const result = await processAgentChat({ message: "도움말" });
    expect(mockNormalize).not.toHaveBeenCalled();
    expect(result.reply).toMatch(/등록/);
    expect(result.llmStatus).toBe("skipped");
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
    expect(result.reply).toMatch(/API key invalid/);
  });

  it("LLM 503 오류 시 규칙 파서 폴백으로 삼전을 등록한다", async () => {
    mockConfigured.mockReturnValue(true);
    mockNormalize.mockResolvedValue({
      normalizedCommand: null,
      actions: [],
      error: "gemini-2.5-flash[rest/json]: HTTP 503: high demand",
    });

    const result = await processAgentChat({ message: "삼전 10주" });
    expect(result.actions[0]).toMatchObject({
      ticker: "005930.KS",
      quantity: 10,
    });
    expect(result.reply).toMatch(/일시적으로 혼잡해 바로 등록/);
    expect(result.reply).not.toMatch(/명령을 이해하지 못했습니다/);
  });

  it("LLM 실패 시 규칙 파서로 폴백한다", async () => {
    mockConfigured.mockReturnValue(true);
    mockNormalize.mockResolvedValue({
      normalizedCommand: null,
      actions: [],
      error: "timeout",
    });

    const result = await processAgentChat({ message: "SOXX 10주 등록" });
    expect(result.actions[0]).toMatchObject({ ticker: "SOXX", quantity: 10 });
    expect(result.reply).toMatch(/기본 명령 형식으로 처리/);
  });

  it("GEMINI 미설정 시 규칙 파서만 사용하고 안내를 붙인다", async () => {
    mockConfigured.mockReturnValue(false);

    const result = await processAgentChat({ message: "이상한 말" });
    expect(mockNormalize).not.toHaveBeenCalled();
    expect(result.reply).toMatch(/이해하지 못했습니다/);
    expect(result.reply).toMatch(/GEMINI_API_KEY/);
    expect(result.llmStatus).toBe("unconfigured");
  });
});
