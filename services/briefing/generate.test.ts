import { describe, expect, it, vi, beforeEach } from "vitest";
import { createEmptySnapshot } from "@/lib/agent/holdings-storage";
import { clearBriefingMemoryForTests, saveBriefing } from "./kv";

vi.mock("@/lib/agent/yahoo-quote", () => ({
  fetchFxRatesFromYahoo: vi.fn(async () => ({ usdKrw: 1350, jpyKrw: 9.2 })),
  fetchYahooLatestClose: vi.fn(async () => 100),
}));

vi.mock("@/services/smart-money/adapter", () => ({
  getSmartMoneyData: vi.fn(async () => ({
    source: "fixture",
    asOfDate: "2026-07-04",
    foreignNetBuyBn: 1.2,
    institutionNetBuyBn: -0.4,
    sectorFlows: [],
    institutionalLens: ["lens"],
  })),
}));

vi.mock("@/services/analyst/adapter", () => ({
  getAnalystReports: vi.fn(async () => []),
}));

import { generateBriefing } from "./generate";

describe("generateBriefing", () => {
  beforeEach(() => {
    clearBriefingMemoryForTests();
    process.env.BRIEFING_DEV_MEMORY = "1";
  });

  it("complete 브리핑을 생성한다", async () => {
    const snap = createEmptySnapshot();
    snap.holdings.push({
      id: "1",
      ticker: "SOXX",
      quantity: 5,
      assetType: "etf",
      currency: "USD",
    });
    const b = await generateBriefing({ snapshot: snap });
    expect(b.status).toBe("complete");
    expect(b.summaryLines.length).toBeGreaterThanOrEqual(3);
    expect(b.scenarios).toHaveLength(4);
    const saved = await saveBriefing(b);
    expect(saved).toBe(true);
  });

  it("forceFail 시 에러", async () => {
    await expect(
      generateBriefing({ snapshot: createEmptySnapshot(), forceFail: true })
    ).rejects.toThrow();
  });
});
