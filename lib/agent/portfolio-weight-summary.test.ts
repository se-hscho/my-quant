import { describe, expect, it } from "vitest";
import type { HoldingsSnapshot } from "@/types/agent";
import {
  buildSectorWeightComparison,
  buildValuationFromPasteRows,
  formatBrokeragePasteSummary,
} from "./portfolio-weight-summary";

describe("buildValuationFromPasteRows", () => {
  it("붙여넣기 행으로 평가 합계를 만든다", () => {
    const valuation = buildValuationFromPasteRows([
      {
        name: "아메리칸 타워",
        ticker: "AMT",
        valueKrw: 6_346_704,
        returnPct: -28.51,
        quantity: 1,
        assetType: "stock",
        currency: "USD",
      },
      {
        name: "CREDIT SUISSE HIGH YIEL",
        ticker: "HYG",
        valueKrw: 2_691,
        returnPct: -23.81,
        quantity: 1,
        assetType: "bond_etf",
        currency: "USD",
      },
    ]);

    expect(valuation.totalKrw).toBe(6_349_395);
    expect(valuation.holdings).toHaveLength(2);
    expect(valuation.warnings).toContain("paste_valuation");
  });
});

describe("buildSectorWeightComparison", () => {
  it("현재 섹터 비중과 1안 추천 비중을 나란히 계산한다", () => {
    const snapshot: HoldingsSnapshot = {
      holdings: [
        {
          id: "1",
          ticker: "AMT",
          quantity: 1,
          assetType: "stock",
          currency: "USD",
          sector: "reits",
        },
        {
          id: "2",
          ticker: "HYG",
          quantity: 1,
          assetType: "bond_etf",
          currency: "USD",
          sector: "bonds",
        },
      ],
      cash: { krw: 0, usd: 0, jpy: 0 },
      updatedAt: "",
    };

    const valuation = buildValuationFromPasteRows([
      {
        name: "아메리칸 타워",
        ticker: "AMT",
        valueKrw: 6_346_704,
        quantity: 1,
        assetType: "stock",
        currency: "USD",
      },
      {
        name: "HYG",
        ticker: "HYG",
        valueKrw: 2_691,
        quantity: 1,
        assetType: "bond_etf",
        currency: "USD",
      },
    ]);

    const rows = buildSectorWeightComparison({ snapshot, valuation });
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((r) => r.sector !== "CASH")).toBe(true);

    const currentSum = rows.reduce((s, r) => s + r.currentPct, 0);
    expect(Math.abs(currentSum - 100)).toBeLessThanOrEqual(0.2);

    const top = rows[0];
    expect(top.currentPct).toBeGreaterThan(0);
    expect(top.recommendedPct).toBeGreaterThanOrEqual(0);
    expect(typeof top.deltaPp).toBe("number");
  });
});

describe("formatBrokeragePasteSummary", () => {
  it("자산 현황 표와 종목 목록을 답변 텍스트로 만든다", () => {
    const text = formatBrokeragePasteSummary({
      rows: [
        {
          name: "아메리칸 타워",
          ticker: "AMT",
          valueKrw: 6_346_704,
          returnPct: -28.51,
          quantity: 1,
          assetType: "stock",
          currency: "USD",
        },
      ],
      comparison: [
        {
          sector: "reits",
          label: "리츠",
          currentPct: 100,
          recommendedPct: 85,
          deltaPp: -15,
        },
      ],
      assetClasses: [{ assetClass: "equity", label: "주식·ETF", currentPct: 100 }],
      subSectors: [{ id: "other", label: "기타", weightPct: 100 }],
      totalKrw: 6_346_704,
      confidence: "high",
    });

    expect(text).toMatch(/자산 현황/);
    expect(text).toMatch(/자산군/);
    expect(text).toMatch(/세부 섹터/);
    expect(text).toMatch(/\| 섹터 \| 현재 \| 추천\(1안\) \| Δ \|/);
    expect(text).toMatch(/아메리칸 타워 \(AMT\)/);
    expect(text).toMatch(/-28\.51%/);
    expect(text).toMatch(/역산/);
  });
});
