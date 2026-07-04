import { describe, expect, it, vi, beforeEach } from "vitest";
import { AGENT_SECTORS, SECTOR_FLOW_FIXTURE } from "@/config/agent";
import { getSmartMoneyFixture } from "./adapter";

vi.mock("./krx-live", () => ({
  fetchKrxInvestorFlow: vi.fn(async () => null),
}));

vi.mock("./naver-live", () => ({
  fetchNaverKospiInvestorFlow: vi.fn(async () => null),
}));

import { fetchKrxInvestorFlow } from "./krx-live";
import { fetchNaverKospiInvestorFlow } from "./naver-live";
import { getSmartMoneyData } from "./adapter";

describe("getSmartMoneyFixture", () => {
  it("전 섹터 수급 fixture 행을 반환한다", () => {
    const data = getSmartMoneyFixture();
    expect(data.sectorFlows).toHaveLength(AGENT_SECTORS.length);
    expect(data.foreignNetBuyBn).toBe(1.2);
    expect(data.institutionNetBuyBn).toBe(-0.4);
    expect(data.institutionalLens.length).toBeGreaterThanOrEqual(2);
    expect(data.source).toBe("fixture");
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

describe("getSmartMoneyData", () => {
  beforeEach(() => {
    vi.mocked(fetchKrxInvestorFlow).mockReset().mockResolvedValue(null);
    vi.mocked(fetchNaverKospiInvestorFlow).mockReset().mockResolvedValue(null);
    delete process.env.SMART_MONEY_FIXTURE_ONLY;
  });

  it("live 모두 실패 시 fixture로 폴백한다", async () => {
    const data = await getSmartMoneyData();
    expect(data.source).toBe("fixture");
    expect(data.foreignNetBuyBn).toBe(1.2);
  });

  it("Naver live 성공 시 KRX보다 우선한다", async () => {
    vi.mocked(fetchNaverKospiInvestorFlow).mockResolvedValue({
      dateYmd: "20260703",
      asOfDate: "2026-07-03",
      foreignNetBuyBn: -2.17,
      institutionNetBuyBn: 4.41,
    });
    vi.mocked(fetchKrxInvestorFlow).mockResolvedValue({
      dateYmd: "20250703",
      foreignNetBuyBn: 9,
      institutionNetBuyBn: 9,
    });
    const data = await getSmartMoneyData();
    expect(data.source).toBe("naver-live");
    expect(data.foreignNetBuyBn).toBe(-2.17);
    expect(fetchKrxInvestorFlow).not.toHaveBeenCalled();
  });

  it("Naver 실패·KRX 성공 시 krx-live", async () => {
    vi.mocked(fetchKrxInvestorFlow).mockResolvedValue({
      dateYmd: "20250703",
      foreignNetBuyBn: 2.5,
      institutionNetBuyBn: -1.1,
    });
    const data = await getSmartMoneyData();
    expect(data.source).toBe("krx-live");
    expect(data.foreignNetBuyBn).toBe(2.5);
  });

  it("SMART_MONEY_FIXTURE_ONLY=1 이면 live를 시도하지 않는다", async () => {
    process.env.SMART_MONEY_FIXTURE_ONLY = "1";
    const data = await getSmartMoneyData();
    expect(fetchNaverKospiInvestorFlow).not.toHaveBeenCalled();
    expect(fetchKrxInvestorFlow).not.toHaveBeenCalled();
    expect(data.source).toBe("fixture");
  });
});
