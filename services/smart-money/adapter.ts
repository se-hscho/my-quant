import type { SmartMoneyData } from "@/services/briefing/types";
import { AGENT_SECTORS, SECTOR_FLOW_FIXTURE } from "@/config/agent";
import "server-only";
import { fetchKrxInvestorFlow } from "./krx-live";

export type SmartMoneySource = "krx-live" | "fixture";

function buildSectorFlows(): SmartMoneyData["sectorFlows"] {
  return AGENT_SECTORS.map((s) => {
    const fixture = SECTOR_FLOW_FIXTURE.find((f) => f.sector === s.id);
    const flowScore = fixture?.flowScore ?? 0.35;
    return {
      sector: s.id,
      label: s.label,
      flowScore,
      relativeStrength7d: flowScore * 100 - 50,
    };
  });
}

const INSTITUTIONAL_LENS = [
  "기관·외국인은 분기 성과·벤치마크 제약으로 대형주·섹터 로테이션을 천천히 실행합니다.",
  "개인은 소액·즉시 체결·현금 100% 보유가 가능해 Follow보다 선점·후행 선택이 유리할 수 있습니다.",
  "13F·펀드 공시는 지연되므로 방향만 읽고 개인 실행 가능한 규모로 번역하는 것이 Follow의 핵심입니다.",
];

export function getSmartMoneyFixture(): SmartMoneyData {
  return {
    source: "fixture",
    asOfDate: new Date().toISOString().slice(0, 10),
    foreignNetBuyBn: 1.2,
    institutionNetBuyBn: -0.4,
    sectorFlows: buildSectorFlows(),
    institutionalLens: INSTITUTIONAL_LENS,
  };
}

function withLiveLens(data: SmartMoneyData, dateYmd: string): SmartMoneyData {
  const asOf = `${dateYmd.slice(0, 4)}-${dateYmd.slice(4, 6)}-${dateYmd.slice(6, 8)}`;
  return {
    ...data,
    source: "krx-live",
    asOfDate: asOf,
    institutionalLens: [
      `KRX 투자자별 거래대금 기준 (${asOf}) — 외국인·기관 순매수(조원).`,
      ...INSTITUTIONAL_LENS.slice(1),
    ],
  };
}

/** KRX live 시도 → 실패 시 fixture. 섹터 흐름은 fixture 유지(섹터별 live 매핑은 Phase 3). */
export async function getSmartMoneyData(): Promise<SmartMoneyData> {
  if (process.env.SMART_MONEY_FIXTURE_ONLY === "1") {
    return getSmartMoneyFixture();
  }

  const live = await fetchKrxInvestorFlow();
  if (!live) {
    return getSmartMoneyFixture();
  }

  const base = getSmartMoneyFixture();
  return withLiveLens(
    {
      ...base,
      foreignNetBuyBn: live.foreignNetBuyBn,
      institutionNetBuyBn: live.institutionNetBuyBn,
    },
    live.dateYmd
  );
}
