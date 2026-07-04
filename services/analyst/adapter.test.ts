import { describe, expect, it, vi, beforeEach } from "vitest";
import { getAnalystFallbackRationale } from "./fallback-rationale";

vi.mock("./kr-wisereport", () => ({
  fetchKrWisereportReports: vi.fn(async () => []),
}));

vi.mock("./finnhub", () => ({
  fetchFinnhubRecommendations: vi.fn(async () => []),
}));

import { fetchKrWisereportReports } from "./kr-wisereport";
import { fetchFinnhubRecommendations } from "./finnhub";
import { getAnalystReports } from "./adapter";

describe("getAnalystReports", () => {
  beforeEach(() => {
    vi.mocked(fetchKrWisereportReports).mockReset().mockResolvedValue([]);
    vi.mocked(fetchFinnhubRecommendations).mockReset().mockResolvedValue([]);
  });

  it("시드에 있는 티커만 필터링한다", async () => {
    const reports = await getAnalystReports(["005930.KS", "UNKNOWN"]);
    expect(reports.length).toBeGreaterThan(0);
    expect(reports.every((r) => r.ticker === "005930.KS")).toBe(true);
    expect(reports.every((r) => r.broker && r.rating && r.date)).toBe(true);
  });

  it("SOXX 시드 리포트를 반환한다", async () => {
    const reports = await getAnalystReports(["SOXX"]);
    expect(reports).toHaveLength(1);
    expect(reports[0].broker).toBe("Goldman Sachs");
  });

  it("빈 티커 목록이면 빈 배열", async () => {
    expect(await getAnalystReports([])).toEqual([]);
  });

  it("live Wisereport가 seed보다 우선한다", async () => {
    vi.mocked(fetchKrWisereportReports).mockResolvedValue([
      {
        ticker: "005930.KS",
        broker: "DB",
        date: "2026-07-03",
        rating: "Buy",
        targetPrice: 360000,
        summary: "live",
      },
    ]);
    const reports = await getAnalystReports(["005930.KS"]);
    expect(reports.some((r) => r.broker === "DB")).toBe(true);
  });

  it("Finnhub live와 seed를 병합한다", async () => {
    vi.mocked(fetchFinnhubRecommendations).mockResolvedValue([
      {
        ticker: "SOXX",
        broker: "Finnhub 컨센서스",
        date: "2026-07-01",
        rating: "Buy",
        summary: "consensus",
      },
    ]);
    const reports = await getAnalystReports(["SOXX"]);
    expect(reports.some((r) => r.broker === "Finnhub 컨센서스")).toBe(true);
    expect(reports.some((r) => r.broker === "Goldman Sachs")).toBe(true);
  });
});

describe("getAnalystFallbackRationale", () => {
  it("미보유 티커용 fallback 문구", () => {
    expect(getAnalystFallbackRationale("XYZ")).toContain("XYZ");
    expect(getAnalystFallbackRationale("XYZ")).toMatch(/참고 데이터/);
  });
});
