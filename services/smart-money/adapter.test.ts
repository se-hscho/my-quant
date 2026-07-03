import { describe, expect, it } from "vitest";
import { AGENT_SECTORS, SECTOR_FLOW_FIXTURE } from "@/config/agent";
import { getSmartMoneyFixture } from "./adapter";

describe("getSmartMoneyFixture", () => {
  it("전 섹터 수급 fixture 행을 반환한다", () => {
    const data = getSmartMoneyFixture();
    expect(data.sectorFlows).toHaveLength(AGENT_SECTORS.length);
    expect(data.foreignNetBuyBn).toBe(1.2);
    expect(data.institutionNetBuyBn).toBe(-0.4);
    expect(data.institutionalLens.length).toBeGreaterThanOrEqual(2);
  });

  it("SECTOR_FLOW_FIXTURE 점수가 반도체·기술에 반영된다", () => {
    const data = getSmartMoneyFixture();
    const semi = data.sectorFlows.find((s) => s.sector === "semiconductor");
    const tech = data.sectorFlows.find((s) => s.sector === "technology");
    const semiFixture = SECTOR_FLOW_FIXTURE.find((f) => f.sector === "semiconductor");
    const techFixture = SECTOR_FLOW_FIXTURE.find((f) => f.sector === "technology");
    expect(semi?.flowScore).toBe(semiFixture?.flowScore);
    expect(tech?.flowScore).toBe(techFixture?.flowScore);
  });

  it("동일 호출 시 결정적 결과를 반환한다", () => {
    const a = getSmartMoneyFixture();
    const b = getSmartMoneyFixture();
    expect(a).toEqual(b);
  });
});
