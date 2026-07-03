import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { processAgentChat } from "./chat-orchestrator";

vi.mock("@/services/ai/gemini", () => ({
  isGeminiConfigured: vi.fn(),
  isBlockedGeminiModel: (model: string) =>
    model.startsWith("gemini-1.5") || model.startsWith("gemini-1.0"),
  GEMINI_DEFAULT_MODEL: "gemini-2.5-flash",
}));

vi.mock("@/services/agent/chat-llm", () => ({
  normalizeChatInputWithLlm: vi.fn(),
}));

import { isGeminiConfigured } from "@/services/ai/gemini";
import { normalizeChatInputWithLlm } from "@/services/agent/chat-llm";

const mockConfigured = vi.mocked(isGeminiConfigured);
const mockNormalize = vi.mocked(normalizeChatInputWithLlm);

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

  it("이미 인식되는 명령은 LLM 없이 처리한다", async () => {
    mockConfigured.mockReturnValue(true);

    const result = await processAgentChat({ message: "SOXX 10주 등록" });
    expect(result.actions[0]).toMatchObject({ ticker: "SOXX", quantity: 10 });
    expect(mockNormalize).not.toHaveBeenCalled();
    expect(result.usedLlm).toBeUndefined();
  });

  it("한국어 별칭(필라델피아 반도체)은 LLM 없이 처리한다", async () => {
    mockConfigured.mockReturnValue(true);

    const result = await processAgentChat({
      message: "필라델피아 반도체 etf 10주 샀어",
    });
    expect(mockNormalize).not.toHaveBeenCalled();
    expect(result.actions[0]).toMatchObject({ ticker: "SOXX", quantity: 10 });
    expect(result.llmStatus).toBe("skipped");
  });

  it("인식 실패 시 LLM actions를 직접 사용한다", async () => {
    mockConfigured.mockReturnValue(true);
    mockNormalize.mockResolvedValue({
      normalizedCommand: "SOXX 10주 등록",
      actions: [
        {
          type: "add_holding",
          ticker: "SOXX",
          quantity: 10,
          assetType: "etf",
          currency: "USD",
        },
      ],
      confidence: "high",
    });

    const result = await processAgentChat({
      message: "요즘 핫한 반도체 테마 10주 사고 싶어",
    });

    expect(mockNormalize).toHaveBeenCalledWith("요즘 핫한 반도체 테마 10주 사고 싶어");
    expect(result.actions[0]).toMatchObject({ ticker: "SOXX", quantity: 10 });
    expect(result.llmStatus).toBe("active");
    expect(result.reply).toMatch(/입력 해석/);
  });

  it("반도체 etf 별칭도 LLM 없이 처리한다", async () => {
    mockConfigured.mockReturnValue(true);

    const result = await processAgentChat({ message: "반도체 etf 10주 샀어" });
    expect(mockNormalize).not.toHaveBeenCalled();
    expect(result.actions[0]).toMatchObject({ ticker: "SOXX", quantity: 10 });
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

  it("GEMINI 미설정 시 규칙 파서만 사용하고 안내를 붙인다", async () => {
    mockConfigured.mockReturnValue(false);

    const result = await processAgentChat({ message: "이상한 말" });
    expect(mockNormalize).not.toHaveBeenCalled();
    expect(result.reply).toMatch(/이해하지 못했습니다/);
    expect(result.reply).toMatch(/GEMINI_API_KEY/);
    expect(result.llmStatus).toBe("unconfigured");
  });
});
