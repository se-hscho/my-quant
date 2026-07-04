import { describe, expect, it, vi, beforeEach } from "vitest";
import { DEMO_PORTFOLIO_SNAPSHOT } from "@/lib/agent/demo-portfolio";
import { clearBriefingMemoryForTests } from "./kv";
import "./generate.test-setup";

vi.mock("@/lib/agent/yahoo-quote", () => ({
  fetchFxRatesFromYahoo: vi.fn(async () => ({ usdKrw: null, jpyKrw: null })),
  fetchYahooLatestClose: vi.fn(async () => null),
  toYahooSymbol: (t: string) => t,
}));

import { generateBriefing } from "./generate";

describe("generateBriefing demo fallback", () => {
  beforeEach(() => {
    clearBriefingMemoryForTests();
  });

  it("Yahoo 전부 실패해도 allowDemoFallback이면 complete 브리핑", async () => {
    const b = await generateBriefing({
      snapshot: DEMO_PORTFOLIO_SNAPSHOT,
      allowDemoFallback: true,
    });
    expect(b.status).toBe("complete");
    expect(b.totalAssetsKrw).toBeGreaterThan(0);
    expect(b.disclaimer).toMatch(/추정치/);
  });
});
