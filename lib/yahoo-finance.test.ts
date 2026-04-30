import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { fetchPrices } from "./yahoo-finance";

const sampleResponse = {
  ticker: "AAPL",
  range: "10y",
  dates: ["2024-01-02", "2024-01-03"],
  closes: [180.5, 182.1],
};

describe("fetchPrices", () => {
  beforeEach(() => {
    localStorage.clear();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("캐시가 없으면 API를 호출하고 localStorage에 저장한다", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => sampleResponse,
    });
    vi.stubGlobal("fetch", fetchMock);

    const r = await fetchPrices("AAPL", "10y");
    expect(r.closes).toEqual([180.5, 182.1]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem("quant:cache:AAPL:10y")).toBeTruthy();
  });

  it("두 번째 호출은 캐시에서 반환되어 fetch가 호출되지 않는다", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => sampleResponse,
    });
    vi.stubGlobal("fetch", fetchMock);

    await fetchPrices("AAPL", "10y");
    await fetchPrices("AAPL", "10y");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("API 실패 시 에러를 throw 한다", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: "boom" }),
      })
    );
    await expect(fetchPrices("AAPL", "10y")).rejects.toThrow(/boom/);
  });

  it("캐시 히트는 5초 이내에 완료된다", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => sampleResponse,
    });
    vi.stubGlobal("fetch", fetchMock);
    await fetchPrices("AAPL", "10y"); // populate

    const start = performance.now();
    await fetchPrices("AAPL", "10y");
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(5000);
  });

  it("캐시 미스 + 정상 응답은 10초 이내에 완료된다", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => sampleResponse,
      })
    );
    const start = performance.now();
    await fetchPrices("MSFT", "10y");
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(10000);
  });
});
