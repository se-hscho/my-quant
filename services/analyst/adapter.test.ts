import { describe, expect, it } from "vitest";
import { getAnalystFallbackRationale, getAnalystReports } from "./adapter";

describe("getAnalystReports", () => {
  it("시드에 있는 티커만 필터링한다", () => {
    const reports = getAnalystReports(["005930.KS", "UNKNOWN"]);
    expect(reports.length).toBeGreaterThan(0);
    expect(reports.every((r) => r.ticker === "005930.KS")).toBe(true);
    expect(reports.every((r) => r.broker && r.rating && r.date)).toBe(true);
  });

  it("SOXX 시드 리포트를 반환한다", () => {
    const reports = getAnalystReports(["SOXX"]);
    expect(reports).toHaveLength(1);
    expect(reports[0].broker).toBe("Goldman Sachs");
  });

  it("빈 티커 목록이면 빈 배열", () => {
    expect(getAnalystReports([])).toEqual([]);
  });
});

describe("getAnalystFallbackRationale", () => {
  it("미보유 티커용 fallback 문구", () => {
    expect(getAnalystFallbackRationale("XYZ")).toContain("XYZ");
    expect(getAnalystFallbackRationale("XYZ")).toMatch(/참고 데이터/);
  });
});
