export type AnalysisLayerId = "L0" | "L1" | "L2" | "L3" | "L4";
export type RecommendationAction = "buy" | "sell" | "new_sector" | "hold" | "fx";

export interface AnalysisLayerItem {
  key: string;
  label: string;
  weightPct: number;
  note?: string;
}

export interface AnalysisLayerSnapshot {
  layer: AnalysisLayerId;
  title: string;
  role: string;
  items: AnalysisLayerItem[];
  insight: string;
}

export interface AnalysisGuideSnapshot {
  intro: string;
  layers: AnalysisLayerSnapshot[];
}

export interface RecommendationGuideRow {
  id: string;
  layer: AnalysisLayerId;
  action: RecommendationAction;
  sector: string;
  label: string;
  ticker: string;
  currentWeightPct?: number;
  targetDeltaPp?: number;
  amountKrw?: number;
  splitGuide?: string;
  scenarioId?: 0 | 1 | 2 | 3;
  /** 매수가 대비 현재 수익률(%) */
  returnPct?: number;
  rationale: string;
  signals: string[];
}
