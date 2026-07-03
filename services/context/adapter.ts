import type { ContextItem } from "@/services/briefing/types";

export function getContextFixture(): ContextItem[] {
  return [
    {
      type: "policy",
      title: "FOMC 금리 동결 시사",
      date: new Date().toISOString().slice(0, 10),
      impact: "금리 민감 섹터(기술·성장) 변동성 완화 가능 — Follow 안 비중 확대 검토에 우호적.",
    },
    {
      type: "news",
      title: "반도체 수출 회복세",
      date: new Date().toISOString().slice(0, 10),
      impact: "반도체 ETF·국내 메모리 수급 개선 기대 — 선점 안 검토 근거로 활용.",
    },
    {
      type: "disclosure",
      title: "보유 종목 실적 시즌",
      date: new Date().toISOString().slice(0, 10),
      impact: "이벤트 전후 안 3(환전만)으로 리스크를 줄이는 구성을 고려.",
    },
  ];
}
