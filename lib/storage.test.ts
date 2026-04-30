import { describe, it, expect, beforeEach } from "vitest";
import {
  saveTempResult,
  saveResult,
  loadResult,
  listResults,
  clearAllResults,
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
});
