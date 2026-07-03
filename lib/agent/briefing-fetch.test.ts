import { describe, expect, it, vi, beforeEach } from "vitest";
import { BriefingFetchError } from "@/types/agent-briefing";
import { fetchOrGenerateBriefing } from "./briefing-fetch";

const mockBriefing = {
  date: "2026-07-03",
  status: "complete" as const,
  summaryLines: ["a"],
  totalAssetsKrw: 1,
  cash: { krw: 0, usd: 0, jpy: 0 },
  sectorTop3: [],
  scenarioComparison: [],
  fxRebalanceLine: "",
  scenarios: [],
  sections: {} as never,
  disclaimer: "",
};

describe("fetchOrGenerateBriefing", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  it("POST 실패 시 API 오류 코드·detail을 포함한다", async () => {
    vi.mocked(fetch).mockImplementation(async (url, init) => {
      const u = String(url);
      if (u.includes("/api/agent/briefing") && !init?.method) {
        return new Response(JSON.stringify({ briefing: null }), { status: 200 });
      }
      if (u.includes("/api/agent/briefing") && init?.method === "POST") {
        return new Response(
          JSON.stringify({
            error: "시세·환율 데이터를 가져오지 못했습니다",
            code: "FX_OR_PRICE_UNAVAILABLE",
            detail: "FX or price data unavailable",
          }),
          { status: 503 }
        );
      }
      return new Response("{}", { status: 404 });
    });

    await expect(
      fetchOrGenerateBriefing({ holdings: [], cash: { krw: 1, usd: 0, jpy: 0 } }, false)
    ).rejects.toBeInstanceOf(BriefingFetchError);

    try {
      await fetchOrGenerateBriefing(
        { holdings: [], cash: { krw: 1, usd: 0, jpy: 0 } },
        false
      );
    } catch (e) {
      expect(e).toBeInstanceOf(BriefingFetchError);
      const err = e as BriefingFetchError;
      expect(err.info.code).toBe("FX_OR_PRICE_UNAVAILABLE");
      expect(err.info.httpStatus).toBe(503);
      expect(err.info.detail).toContain("FX or price data unavailable");
    }
  });
});
