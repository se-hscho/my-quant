import { describe, expect, it, vi, beforeEach } from "vitest";
import { clearBriefingMemoryForTests } from "./kv";
import "./generate.test-setup";

vi.mock("@/lib/agent/yahoo-quote", () => ({
  fetchFxRatesFromYahoo: vi.fn(async () => ({ usdKrw: 1350, jpyKrw: 9.2 })),
  fetchYahooLatestClose: vi.fn(async () => 100),
  toYahooSymbol: (t: string) => t,
}));

import { generateBriefing } from "./generate";
import { createEmptySnapshot } from "@/lib/agent/holdings-storage";

describe("generateBriefing cash-only deployment", () => {
  beforeEach(() => {
    clearBriefingMemoryForTests();
    process.env.BRIEFING_DEV_MEMORY = "1";
  });

  it("현금 2천만원만 등록 시 investmentDirection 섹션 생성", async () => {
    const snap = createEmptySnapshot();
    snap.cash.krw = 20_000_000;

    const b = await generateBriefing({ snapshot: snap, allowDemoFallback: true });

    expect(b.sections.investmentDirection?.mode).toBe("deployment");
    expect(b.sections.investmentDirection?.combinations.length).toBe(3);
    expect(b.summaryLines.some((l) => l.includes("20,000,000") || l.includes("2000"))).toBe(
      true
    );
    expect(b.sections.context.items.every((i) => i.sourceUrl?.startsWith("https://"))).toBe(true);
  });
});
