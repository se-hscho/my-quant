import { describe, expect, it } from "vitest";
import { computePriceTrendFromCloses, formatTrendPct } from "./price-trends";

describe("computePriceTrendFromCloses", () => {
  it("1일·7일·1개월 변동률을 계산한다", () => {
    const closes = Array.from({ length: 30 }, (_, i) => 100 + i);
    const trend = computePriceTrendFromCloses(closes);
    expect(trend.d1).toBeCloseTo(1 / 128 * 100, 1);
    expect(trend.d7).toBeCloseTo(7 / 122 * 100, 1);
    expect(trend.m1).toBeCloseTo(22 / 107 * 100, 1);
  });
});

describe("formatTrendPct", () => {
  it("부호와 소수 한 자리를 표시한다", () => {
    expect(formatTrendPct(1.23)).toBe("+1.2%");
    expect(formatTrendPct(-2.5)).toBe("-2.5%");
    expect(formatTrendPct(null)).toBe("—");
  });
});
