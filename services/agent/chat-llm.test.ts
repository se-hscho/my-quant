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

  it("자연어를 명령 형식으로 변환한다", async () => {
    mockGenerate.mockResolvedValue({
      normalizedCommand: "SOXX 10주 등록",
      confidence: "high",
    });

    const result = await normalizeChatInputWithLlm("반도체 etf 10주 샀어요");
    expect(result?.normalizedCommand).toBe("SOXX 10주 등록");
  });

  it("명령이 아니면 normalizedCommand가 null이다", async () => {
    mockGenerate.mockResolvedValue({
      normalizedCommand: null,
      confidence: "low",
    });

    const result = await normalizeChatInputWithLlm("안 2가 뭐야?");
    expect(result?.normalizedCommand).toBeNull();
  });

  it("LLM 실패 시 null을 반환한다", async () => {
    mockGenerate.mockResolvedValue(null);
    expect(await normalizeChatInputWithLlm("뭔가 해줘")).toBeNull();
  });
});
