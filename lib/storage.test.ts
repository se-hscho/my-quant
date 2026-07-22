import { describe, it, expect, beforeEach } from "vitest";
import {
  saveTempResult,
  saveResult,
  loadResult,
  listResults,
  clearAllResults,
  deleteResult,
} from "./storage";
import type { PortfolioResult } from "@/types";

const sample = (id: string, savedAt = "2024-01-01T00:00:00Z"): PortfolioResult => ({
  id,
  bundleId: "b",
  bundleName: "B",
  method: "max-sharpe",
  tickers: ["AAPL"],
  weights: { AAPL: 1 },
  metrics: { annualReturn: 0.1, volatility: 0.2, sharpe: 0.5, mdd: -0.3 },
  frontier: [],
  savedAt,
});

describe("storage", () => {
  beforeEach(() => {
    clearAllResults();
    localStorage.clear();
  });

  it("temp 저장 후 loadResult가 임시본을 반환한다", () => {
    saveTempResult(sample("t1"));
    expect(loadResult("t1")?.id).toBe("t1");
  });

  it("saveResult 후에는 listResults에 포함되고 loadResult가 우선 반환한다", () => {
    saveTempResult(sample("t2"));
    saveResult(sample("t2"));
    expect(listResults().map((r) => r.id)).toContain("t2");
    expect(loadResult("t2")?.id).toBe("t2");
  });

  it("listResults는 최신순(저장 역순)으로 정렬된다", async () => {
    saveResult(sample("a"));
    await new Promise((r) => setTimeout(r, 5));
    saveResult(sample("b"));
    await new Promise((r) => setTimeout(r, 5));
    saveResult(sample("c"));
    const ids = listResults().map((r) => r.id);
    expect(ids).toEqual(["c", "b", "a"]);
  });

  it("deleteResult는 영구 목록과 임시 캐시 양쪽에서 결과를 제거한다", () => {
    saveTempResult(sample("d1"));
    saveResult(sample("d1"));
    saveResult(sample("d2"));
    expect(loadResult("d1")?.id).toBe("d1");

    deleteResult("d1");

    expect(loadResult("d1")).toBeNull();
    expect(listResults().map((r) => r.id)).toEqual(["d2"]);
  });

  it("deleteResult는 존재하지 않는 id에 대해서도 안전하다", () => {
    saveResult(sample("only"));
    expect(() => deleteResult("missing")).not.toThrow();
    expect(listResults().map((r) => r.id)).toEqual(["only"]);
  });
});
