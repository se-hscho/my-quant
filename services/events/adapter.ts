import type { EventTimelineItem } from "@/services/briefing/types";

export function getEventsFixture(): EventTimelineItem[] {
  return [
    {
      phase: "before",
      title: "실적 발표 D-3",
      bullets: [
        {
          direction: "변동성 확대 대비 현금 비중 점검",
          rationale: "이벤트 전 포지션 축소는 안 3과 정합적입니다.",
        },
      ],
    },
    {
      phase: "today",
      title: "CPI 발표",
      bullets: [
        {
          direction: "Follow 안 — 반도체 비중 소폭 확대 검토",
          rationale: "인플레이션 둔화 시나리오에서 성장 섹터 수급 개선 참고 데이터.",
        },
      ],
    },
    {
      phase: "after",
      title: "금통위 D+2",
      bullets: [
        {
          direction: "환율 변동 시 환전 타이밍 재검토",
          rationale: "USD 자산 매수 전 KRW→USD 환전 단계를 playbook 0단계로 배치.",
        },
      ],
    },
  ];
}
