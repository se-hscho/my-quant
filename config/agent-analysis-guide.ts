import type { AgentSectorId } from "./agent";

/** 분석·제안 4단+ 계층 (idea.md L0~L4) */
export const ANALYSIS_LAYERS = [
  { id: "L0", title: "통화·현금", role: "환전·결제 재원, 환율 노출" },
  { id: "L1", title: "자산군", role: "전체 그림·리스크 요약" },
  { id: "L2", title: "지역", role: "한국·미국·일본 rotation" },
  { id: "L3", title: "섹터", role: "섹터 ETF·지수 기반 자금 흐름" },
  { id: "L4", title: "보유 종목", role: "실제 보유 티커 비중·조정" },
] as const;

export type AnalysisLayerId = (typeof ANALYSIS_LAYERS)[number]["id"];

/** 섹터별 대표 proxy ETF·종목 (미보유 신규 추천용) */
export const SECTOR_PROXY_TICKERS: Partial<
  Record<AgentSectorId, { us: string; kr?: string; label?: string }>
> = {
  semiconductor: { us: "SOXX", kr: "091160.KS", label: "반도체" },
  technology: { us: "QQQ", kr: "069500.KS", label: "기술·성장" },
  healthcare: { us: "XLV", kr: "143860.KS", label: "헬스케어" },
  energy: { us: "XLE", kr: "261220.KS", label: "에너지" },
  financials: { us: "XLF", label: "금융" },
  consumer: { us: "XLY", label: "소비재" },
  industrial: { us: "XLI", label: "산업재" },
  materials: { us: "XLB", label: "소재" },
  utilities: { us: "XLU", label: "유틸리티" },
  real_estate: { us: "XLRE", label: "부동산" },
  gold: { us: "GLD", kr: "132030.KS", label: "금·원자재" },
  bonds: { us: "AGG", kr: "152100.KS", label: "채권" },
};

export const INFLOW_THRESHOLD = 0.5;
export const OUTFLOW_THRESHOLD = 0.4;
export const OVERWEIGHT_MIN_PP = 3;

/** 수익률 기반 행동 힌트 (참고용) */
export const RETURN_TAKE_PROFIT_PCT = 25;
export const RETURN_CUT_LOSS_PCT = -15;
export const RETURN_DIP_BUY_PCT = -10;
