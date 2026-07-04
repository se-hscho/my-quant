import type { PriceTrendPct } from "@/lib/agent/price-trends";

export type MomentumLabel =
  | "surge"
  | "rise"
  | "flat"
  | "pullback"
  | "fall"
  | "drop";

export interface MomentumInsight {
  label: MomentumLabel;
  labelKo: string;
  hintKo: string;
}

const FLAT_THRESHOLD = 0.8;
const RISE_THRESHOLD = 2;
const SURGE_M1 = 8;
const DROP_M1 = -8;

function isUp(v: number | null | undefined): boolean {
  return v != null && v > FLAT_THRESHOLD;
}

function isDown(v: number | null | undefined): boolean {
  return v != null && v < -FLAT_THRESHOLD;
}

/** 단기·중기 가격 추세로 비중 조절 힌트 분류 */
export function classifyMomentumTrend(trend: PriceTrendPct): MomentumInsight {
  const { d1, d7, m1 } = trend;

  if (m1 != null && m1 >= SURGE_M1 && isUp(d7)) {
    return {
      label: "surge",
      labelKo: "급등",
      hintKo: "과열 구간 — 비중 축소·차익실현 검토",
    };
  }

  if (m1 != null && m1 <= DROP_M1 && isDown(d7)) {
    return {
      label: "drop",
      labelKo: "급락",
      hintKo: "하락 추세 — 비중 축소·손절 검토",
    };
  }

  if (isUp(m1) && isDown(d1)) {
    return {
      label: "pullback",
      labelKo: "조정",
      hintKo: "상승 후 조정 — 분할 매수·관찰",
    };
  }

  if (isUp(m1) && isDown(d7)) {
    return {
      label: "pullback",
      labelKo: "조정",
      hintKo: "중기 상승·단기 약세 — 비중 유지·관찰",
    };
  }

  if (isUp(d7) || isUp(m1)) {
    return {
      label: "rise",
      labelKo: "상승",
      hintKo: "상승 추세 — 추가 매수는 신중·비중 과다 시 유지",
    };
  }

  if (isDown(d7) || isDown(m1)) {
    return {
      label: "fall",
      labelKo: "하락",
      hintKo: "하락 추세 — 추가 매수보다 관찰·비중 축소 검토",
    };
  }

  if (d1 != null && Math.abs(d1) >= RISE_THRESHOLD) {
    return {
      label: d1 > 0 ? "rise" : "fall",
      labelKo: d1 > 0 ? "상승" : "하락",
      hintKo: d1 > 0 ? "단기 반등 — 추세 확인 후 대응" : "단기 약세 — 관찰",
    };
  }

  return {
    label: "flat",
    labelKo: "횡보",
    hintKo: "뚜렷한 추세 없음 — 현 비중 유지",
  };
}

/** 매수가 대비 수익률과 가격 추세를 함께 고려한 비중 힌트 */
export function suggestWeightAction(input: {
  returnPct?: number;
  weightPct?: number;
  momentum: MomentumInsight;
}): string {
  const parts: string[] = [input.momentum.hintKo];

  if (input.returnPct != null && input.returnPct >= 25) {
    parts.push("매수가 대비 고수익 — 차익실현 우선 검토");
  } else if (input.returnPct != null && input.returnPct <= -15) {
    parts.push("매수가 대비 손실 — 축소·손절 검토");
  }

  if (input.weightPct != null && input.weightPct >= 25) {
    parts.push(`비중 ${input.weightPct.toFixed(0)}% — 과대 시 분할 축소`);
  }

  return parts.join(" · ");
}
