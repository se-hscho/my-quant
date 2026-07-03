import { describe, expect, it } from "vitest";
import { DEMO_PORTFOLIO_SNAPSHOT } from "@/lib/agent/demo-portfolio";
import { clearBriefingMemoryForTests } from "./kv";
import { generateBriefing } from "./generate";

/**
 * Yahoo API 실호출 통합 테스트 — mock 없음.
 * CI/로컬에서 Yahoo 차단 시 skip (Vercel과 동일 경로 검증용).
 */
describe("generateBriefing integration (real Yahoo)", () => {
  it("데모 포트폴리오로 complete 브리핑을 생성한다", async () => {
    clearBriefingMemoryForTests();
    const b = await generateBriefing({ snapshot: DEMO_PORTFOLIO_SNAPSHOT });
    expect(b.status).toBe("complete");
    expect(b.summaryLines.length).toBeGreaterThanOrEqual(3);
    expect(b.scenarios).toHaveLength(4);
    expect(b.totalAssetsKrw).toBeGreaterThan(0);
  }, 30_000);
});
