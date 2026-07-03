import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { generateGeminiJson, getGeminiApiKey, isGeminiConfigured } from "./gemini";

describe("gemini", () => {
  const originalKey = process.env.GEMINI_API_KEY;

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    if (originalKey === undefined) {
      delete process.env.GEMINI_API_KEY;
    } else {
      process.env.GEMINI_API_KEY = originalKey;
    }
  });

  it("GEMINI_API_KEY가 없으면 isGeminiConfigured는 false다", () => {
    delete process.env.GEMINI_API_KEY;
    expect(isGeminiConfigured()).toBe(false);
    expect(getGeminiApiKey()).toBeNull();
  });

  it("GEMINI_API_KEY가 있으면 isGeminiConfigured는 true다", () => {
    process.env.GEMINI_API_KEY = "test-key";
    expect(isGeminiConfigured()).toBe(true);
  });

  it("API 키 없으면 generateGeminiJson은 null을 반환한다", async () => {
    delete process.env.GEMINI_API_KEY;
    const result = await generateGeminiJson<{ ok: boolean }>("sys", "user");
    expect(result).toBeNull();
  });
});
