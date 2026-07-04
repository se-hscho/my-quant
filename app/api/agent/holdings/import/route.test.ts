import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/agent/holdings/import/route";

vi.mock("@/services/ai/gemini", () => ({
  isGeminiConfigured: vi.fn(() => true),
}));

vi.mock("@/services/ai/llm-rate-limit", () => ({
  canInvokeLlm: vi.fn(() => true),
  getLlmRateLimitStatus: vi.fn(() => ({ retryAfterMs: 0 })),
  recordLlmCall: vi.fn(),
}));

vi.mock("@/services/agent/holdings-import-vision", () => ({
  extractHoldingsFromScreenshot: vi.fn(),
}));

import { isGeminiConfigured } from "@/services/ai/gemini";
import { extractHoldingsFromScreenshot } from "@/services/agent/holdings-import-vision";

const mockExtract = vi.mocked(extractHoldingsFromScreenshot);
const mockConfigured = vi.mocked(isGeminiConfigured);

describe("POST /api/agent/holdings/import", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockConfigured.mockReturnValue(true);
  });

  it("유효한 이미지면 추출 결과를 반환한다", async () => {
    mockExtract.mockResolvedValue({
      ok: true,
      model: "gemini-2.5-flash",
      result: {
        holdings: [
          {
            ticker: "AAPL",
            quantity: 5,
            avgCost: 180,
            assetType: "stock",
            currency: "USD",
          },
        ],
      },
    });

    const tinyPng = Buffer.from("fake").toString("base64");
    const res = await POST(
      new Request("http://localhost/api/agent/holdings/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: tinyPng, mimeType: "image/png" }),
      })
    );

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.result.holdings[0].ticker).toBe("AAPL");
  });

  it("GEMINI 미설정이면 503", async () => {
    mockConfigured.mockReturnValue(false);
    const res = await POST(
      new Request("http://localhost/api/agent/holdings/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: "abc", mimeType: "image/png" }),
      })
    );
    expect(res.status).toBe(503);
  });

  it("잘못된 mimeType이면 400", async () => {
    const res = await POST(
      new Request("http://localhost/api/agent/holdings/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: "abc", mimeType: "application/pdf" }),
      })
    );
    expect(res.status).toBe(400);
  });
});
