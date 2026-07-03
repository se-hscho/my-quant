import { describe, it, expect, vi, beforeEach } from "vitest";
import { normalizeChatInputWithLlm } from "./chat-llm";

vi.mock("@/services/ai/gemini", () => ({
  generateGeminiJson: vi.fn(),
}));

import { generateGeminiJson } from "@/services/ai/gemini";

const mockGenerate = vi.mocked(generateGeminiJson);

describe("normalizeChatInputWithLlm", () => {
  beforeEach(() => {
    mockGenerate.mockReset();
  });

  it("구조화된 actions를 반환한다", async () => {
    mockGenerate.mockResolvedValue({
      ok: true,
      model: "gemini-2.0-flash",
      data: {
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
      },
    });

    const result = await normalizeChatInputWithLlm("반도체 etf 10주 샀어요");
    expect(result?.actions[0]).toMatchObject({ ticker: "SOXX", quantity: 10 });
    expect(result?.normalizedCommand).toBe("SOXX 10주 등록");
  });

  it("API 실패 시 error를 담는다", async () => {
    mockGenerate.mockResolvedValue({
      ok: false,
      error: "404 model not found",
    });

    const result = await normalizeChatInputWithLlm("뭔가 해줘");
    expect(result?.error).toMatch(/404/);
    expect(result?.actions).toEqual([]);
  });
});
