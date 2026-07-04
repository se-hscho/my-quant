import type { SmartMoneyData } from "@/services/briefing/types";
import { AGENT_SECTORS, SECTOR_FLOW_FIXTURE } from "@/config/agent";

export function getSmartMoneyFixture(): SmartMoneyData {
  const sectorFlows = AGENT_SECTORS.map((s) => {
    const fixture = SECTOR_FLOW_FIXTURE.find((f) => f.sector === s.id);
    return {
      sector: s.id,
      label: s.label,
      flowScore: fixture?.flowScore ?? 0.35,
      relativeStrength7d: (fixture?.flowScore ?? 0.35) * 100 - 50,
    };
  });

  return {
    foreignNetBuyBn: 1.2,
    institutionNetBuyBn: -0.4,
    sectorFlows,
    institutionalLens: [
      "기관·외국인은 분기 성과·벤치마크 제약으로 대형주·섹터 로테이션을 천천히 실행합니다.",
      "개인은 소액·즉시 체결·현금 100% 보유가 가능해 Follow보다 선점·후행 선택이 유리할 수 있습니다.",
      "13F·펀드 공시는 지연되므로 방향만 읽고 개인 실행 가능한 규모로 번역하는 것이 Follow의 핵심입니다.",
    ],
  };
}
