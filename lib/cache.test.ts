import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { loadCache, saveCache, clearCache } from "./cache";

describe("cache", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useRealTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("저장 후 같은 ticker·range로 로드하면 동일 객체를 돌려준다", () => {
    saveCache({
      ticker: "AAPL",
      range: "10y",
      dates: ["2024-01-02"],
      closes: [180.5],
      cachedAt: Date.now(),
    });
    const got = loadCache("AAPL", "10y");
    expect(got?.closes).toEqual([180.5]);
  });

  it("당일 자정 이전 cachedAt을 가진 캐시는 무효", () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(12, 0, 0, 0);
    saveCache({
      ticker: "MSFT",
      range: "1y",
      dates: ["2024-01-02"],
      closes: [400],
      cachedAt: yesterday.getTime(),
    });
    expect(loadCache("MSFT", "1y")).toBeNull();
  });

  it("clearCache는 quant:cache:* 만 제거한다", () => {
    saveCache({
      ticker: "X", range: "1y", dates: [], closes: [], cachedAt: Date.now(),
    });
    localStorage.setItem("other", "keep");
    clearCache();
    expect(loadCache("X", "1y")).toBeNull();
    expect(localStorage.getItem("other")).toBe("keep");
  });
});
