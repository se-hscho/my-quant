import { describe, expect, it, vi, beforeEach } from "vitest";
import { BriefingFetchError } from "@/types/agent-briefing";
import { fetchOrGenerateBriefing, loadReportBriefing } from "./briefing-fetch";
import { DEMO_PORTFOLIO_SNAPSHOT } from "./demo-portfolio";

const mockBriefing = {
  date: "2026-07-04",
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
    localStorage.clear();
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

describe("loadReportBriefing", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    localStorage.clear();
  });

  it("GET 404 후 POST로 재생성한다 (미보유=demo)", async () => {
    vi.mocked(fetch).mockImplementation(async (url, init) => {
      const u = String(url);
      if (u.includes("/api/agent/briefing/2026-07-04") && !init?.method) {
        return new Response(
          JSON.stringify({
            error: "브리핑을 찾을 수 없습니다",
            code: "BRIEFING_NOT_FOUND",
            detail: "date=2026-07-04, demo=true",
          }),
          { status: 404 }
        );
      }
      if (u.includes("/api/agent/briefing") && init?.method === "POST") {
        return new Response(JSON.stringify(mockBriefing), { status: 200 });
      }
      return new Response("{}", { status: 404 });
    });

    const result = await loadReportBriefing("2026-07-04", false);
    expect(result.isDemo).toBe(true);
    expect(result.briefing.status).toBe("complete");
  });

  it("보유 등록 시 demo=false로 POST 재생성", async () => {
    localStorage.setItem(
      "agent:holdings:v1",
      JSON.stringify({
        holdings: [
          {
            id: "1",
            ticker: "SOXX",
            quantity: 1,
            assetType: "etf",
            currency: "USD",
          },
        ],
        cash: { krw: 0, usd: 0, jpy: 0 },
        updatedAt: new Date().toISOString(),
      })
    );

    vi.mocked(fetch).mockImplementation(async (url, init) => {
      const u = String(url);
      if (u.includes("/api/agent/briefing/2026-07-04") && !init?.method) {
        return new Response(
          JSON.stringify({ error: "not found", code: "BRIEFING_NOT_FOUND" }),
          { status: 404 }
        );
      }
      if (u.includes("/api/agent/briefing") && init?.method === "POST") {
        const body = JSON.parse(String(init.body)) as { demo?: boolean; date?: string };
        expect(body.demo).toBe(false);
        expect(body.date).toBe("2026-07-04");
        return new Response(JSON.stringify(mockBriefing), { status: 200 });
      }
      return new Response("{}", { status: 404 });
    });

    const result = await loadReportBriefing("2026-07-04", false);
    expect(result.isDemo).toBe(false);
  });
});
