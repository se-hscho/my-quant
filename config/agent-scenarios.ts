/** 브리핑 시나리오 ID (0=유지, 1=Follow, 2=선점, 3=최소변경) */
export type ScenarioId = 0 | 1 | 2 | 3;

export interface ScenarioDisplayMeta {
  id: ScenarioId;
  shortName: string;
  title: string;
  /** 한 줄 실행 요약 — 레포트 caption·요약용 */
  summary: string;
  /** 분할 매수 방식 — playbook 도움말 */
  splitStyle: string;
}

export const SCENARIO_DISPLAY: Record<ScenarioId, ScenarioDisplayMeta> = {
  0: {
    id: 0,
    shortName: "유지",
    title: "현재 비중 그대로 유지",
    summary: "당일 조정 없이 기존 포트 유지",
    splitStyle: "조정 없음",
  },
  1: {
    id: 1,
    shortName: "Follow",
    title: "기관·외국인 수급 방향 따라 점진 조정",
    summary: "유입 섹터 균등 3분할 매수",
    splitStyle: "균등 3분할",
  },
  2: {
    id: 2,
    shortName: "선점",
    title: "유입 섹터 선행 분할 매수",
    summary: "50·30·20 선행 분할로 속도 높임",
    splitStyle: "선행 50·30·20",
  },
  3: {
    id: 3,
    shortName: "최소변경",
    title: "소량 코어 + 현금 비중 유지",
    summary: "이벤트·변동성 대비 최소 조정",
    splitStyle: "소량·환전 위주",
  },
};

/** @deprecated 내부 shortName — UI에는 formatScenarioHeading 사용 */
export const SCENARIO_SHORT_LABELS: Record<ScenarioId, string> = {
  0: SCENARIO_DISPLAY[0].shortName,
  1: SCENARIO_DISPLAY[1].shortName,
  2: SCENARIO_DISPLAY[2].shortName,
  3: SCENARIO_DISPLAY[3].shortName,
};

export function scenarioOptionSuffix(id: ScenarioId): string {
  return `(${id}안)`;
}

/** Follow — 기관·외국인 수급 방향 따라 점진 조정 (1안) */
export function formatScenarioHeading(id: ScenarioId): string {
  const m = SCENARIO_DISPLAY[id];
  return `${m.shortName} — ${m.title} ${scenarioOptionSuffix(id)}`;
}

/** Follow (1안) — 차트·짧은 라벨 */
export function formatScenarioChartLabel(id: ScenarioId): string {
  const m = SCENARIO_DISPLAY[id];
  return `${m.shortName} ${scenarioOptionSuffix(id)}`;
}

/** 본문·근거 문장용 — Follow — … (1안) */
export function formatScenarioReference(id: ScenarioId): string {
  return formatScenarioHeading(id);
}
