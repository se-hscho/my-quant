import { describe, expect, it, vi, beforeEach } from "vitest";
import { DEMO_PORTFOLIO_SNAPSHOT } from "@/lib/agent/demo-portfolio";
import { clearBriefingMemoryForTests } from "./kv";
import "./generate.test-setup";

vi.mock("@/lib/agent/yahoo-quote", () => ({
  fetchFxRatesFromYahoo: vi.fn(async () => ({ usdKrw: 1350, jpyKrw: 9.2 })),
  fetchYahooLatestClose: vi.fn(async () => 100),
  toYahooSymbol: (t: string) => t,
}));

import { generateBriefing } from "./generate";

describe("generateBriefing fixture sections", () => {
  beforeEach(() => {
    clearBriefingMemoryForTests();
    process.env.BRIEFING_DEV_MEMORY = "1";
  });

  it("mock/fixture 어댑터 데이터가 브리핑 sections에 연결된다", async () => {
    const b = await generateBriefing({ snapshot: DEMO_PORTFOLIO_SNAPSHOT });

    expect(b.sections.smartMoney.sectorFlows.length).toBeGreaterThan(0);
    expect(b.sections.smartMoney.institutionalLens.length).toBeGreaterThanOrEqual(2);
    expect(b.sections.context.items).toHaveLength(3);
    expect(b.sections.events.timeline).toHaveLength(3);
    expect(b.sections.sectorFlows.inflowNote).toMatch(/유입/);
    expect(b.sections.recommendations.rows.length).toBeGreaterThan(0);
    expect(b.sections.analysisGuide.layers).toHaveLength(5);
    expect(b.sections.analyst.reports.length).toBeGreaterThan(0);
    expect(b.sections.diff).toBeDefined();
    expect(b.sections.portfolio.returns.d7).toBeDefined();
  });

  it("애널 시드(005930.KS)가 있으면 summaryLines에 반영된다", async () => {
    const b = await generateBriefing({ snapshot: DEMO_PORTFOLIO_SNAPSHOT });
    const joined = b.summaryLines.join(" ");
    expect(joined).toMatch(/애널|미래에셋|Buy/i);
  });

  it("오늘 이벤트 fixture가 summaryLines에 반영된다", async () => {
    const b = await generateBriefing({ snapshot: DEMO_PORTFOLIO_SNAPSHOT });
    expect(b.summaryLines.some((l) => /CPI|이벤트|오늘/i.test(l))).toBe(true);
  });

  it("사용자 노출 문구에 fixture 개발 용어가 없다", async () => {
    const b = await generateBriefing({ snapshot: DEMO_PORTFOLIO_SNAPSHOT });
    const userFacing = [
      ...b.summaryLines,
      b.sections.sectorFlows.inflowNote,
      b.sections.sectorFlows.outflowNote,
      ...(b.sections.diff?.reason ?? []),
      ...b.sections.events.timeline.flatMap((e) => e.bullets.map((bul) => bul.rationale)),
    ].join(" ");
    expect(userFacing).not.toMatch(/fixture/i);
  });
});
