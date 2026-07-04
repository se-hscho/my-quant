import { describe, expect, it } from "vitest";
import { DEMO_PORTFOLIO_SNAPSHOT, resolveBriefingDate } from "./demo-portfolio";

describe("DEMO_PORTFOLIO_SNAPSHOT", () => {
  it("예시 보유 3종목과 현금을 포함한다", () => {
    expect(DEMO_PORTFOLIO_SNAPSHOT.holdings).toHaveLength(3);
    expect(DEMO_PORTFOLIO_SNAPSHOT.cash.krw).toBeGreaterThan(0);
    expect(DEMO_PORTFOLIO_SNAPSHOT.cash.usd).toBeGreaterThan(0);
  });

  it("resolveBriefingDate는 today를 오늘 날짜로 변환한다", () => {
    const today = new Date().toISOString().slice(0, 10);
    expect(resolveBriefingDate("today")).toBe(today);
    expect(resolveBriefingDate("2026-07-03")).toBe("2026-07-03");
  });
});
