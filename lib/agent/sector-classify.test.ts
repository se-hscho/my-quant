import { describe, it, expect } from "vitest";
import {
  classifyTicker,
  inferRegionFromTicker,
  holdingNeedsSectorTag,
} from "./sector-classify";

describe("classifyTicker", () => {
  it("알려진 티커 SOXX는 반도체로 분류된다", () => {
    expect(classifyTicker("SOXX")).toEqual({
      sector: "semiconductor",
      region: "US",
    });
  });

  it("알려진 티커 005930.KS는 반도체·KR로 분류된다", () => {
    expect(classifyTicker("005930.KS")).toEqual({
      sector: "semiconductor",
      region: "KR",
    });
  });

  it("알 수 없는 티커는 null을 반환한다", () => {
    expect(classifyTicker("UNKNOWNXYZ")).toBeNull();
  });
});

describe("inferRegionFromTicker", () => {
  it(".KS 접미사는 KR을 반환한다", () => {
    expect(inferRegionFromTicker("123456.KS")).toBe("KR");
  });

  it(".T 접미사는 JP를 반환한다", () => {
    expect(inferRegionFromTicker("7203.T")).toBe("JP");
  });

  it("접미사가 없으면 null을 반환한다", () => {
    expect(inferRegionFromTicker("AAPL")).toBeNull();
  });
});

describe("holdingNeedsSectorTag", () => {
  it("sector가 없으면 true다", () => {
    expect(
      holdingNeedsSectorTag({
        id: "1",
        ticker: "FOO",
        quantity: 1,
        assetType: "stock",
        currency: "USD",
      })
    ).toBe(true);
  });

  it("sector가 있으면 false다", () => {
    expect(
      holdingNeedsSectorTag({
        id: "1",
        ticker: "FOO",
        quantity: 1,
        assetType: "stock",
        currency: "USD",
        sector: "technology",
      })
    ).toBe(false);
  });
});
