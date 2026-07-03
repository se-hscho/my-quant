import { describe, expect, it } from "vitest";
import { canInvokeLlm, getLlmRateLimitStatus, recordLlmCall } from "./llm-rate-limit";

describe("llm-rate-limit", () => {
  it("호출 기록 후 remaining이 줄어든다", () => {
    const before = getLlmRateLimitStatus().remaining;
    recordLlmCall();
    const after = getLlmRateLimitStatus().remaining;
    expect(after).toBeLessThanOrEqual(before - 1);
    expect(canInvokeLlm()).toBe(after > 0);
  });
});
