import { formatScenarioReference } from "@/config/agent-scenarios";
import type { Briefing } from "./types";

export function diffBriefings(prev: Briefing | null, curr: Briefing): Briefing["sections"]["diff"] {
  if (!prev) {
    return {
      rows: [{ field: "브리핑", before: "—", after: "최초 생성", direction: "new" }],
      reason: ["전일 브리핑이 없어 비교 기준일이 없습니다. 오늘 제안을 기준선으로 삼아 검토하세요."],
    };
  }

  const rows: NonNullable<Briefing["sections"]["diff"]>["rows"] = [];
  const prevFollow = prev.scenarios.find((s) => s.id === 1);
  const currFollow = curr.scenarios.find((s) => s.id === 1);
  if (prevFollow && currFollow) {
    const prevRet = prevFollow.expectedReturn;
    const currRet = currFollow.expectedReturn;
    if (prevRet !== currRet) {
      rows.push({
        field: `${formatScenarioReference(1)} 예상 수익률`,
        before: `${prevRet}%`,
        after: `${currRet}%`,
        direction: currRet > prevRet ? "up" : "down",
      });
    }
  }

  if (prev.fxRebalanceLine !== curr.fxRebalanceLine) {
    rows.push({
      field: "환전·리밸런싱 시점",
      before: prev.fxRebalanceLine.slice(0, 40),
      after: curr.fxRebalanceLine.slice(0, 40),
      direction: "new",
    });
  }

  return {
    rows: rows.length > 0 ? rows : [{ field: "제안", before: "유지", after: "유지", direction: "new" }],
    reason: [
      "전일 대비 수급·맥락 참고 데이터 변동을 반영했습니다.",
      `변경이 없더라도 이벤트 전후에는 ${formatScenarioReference(3)}을 함께 검토하세요.`,
    ],
  };
}
