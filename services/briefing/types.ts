import type { CashBalances, Currency } from "@/types/agent";

export type BriefingScenarioId = 0 | 1 | 2 | 3;
export type BriefingStatus = "complete" | "failed" | "partial";

export interface PlaybookStep {
  order: number;
  action: "fx" | "sell" | "buy" | "hold";
  ticker?: string;
  deltaPp?: number;
  currency: Currency;
  note?: string;
}

export interface BriefingScenario {
  id: BriefingScenarioId;
  label: string;
  expectedReturn: number;
  expectedVolatility: number;
  assetReturn: number;
  fxImpact: number;
  weightsBefore: Record<string, number>;
  weightsAfter: Record<string, number>;
  cashAfter: CashBalances;
  playbook: PlaybookStep[];
}

export interface SectorFlowRow {
  sector: string;
  label: string;
  flowScore: number;
  relativeStrength7d: number;
}

export interface RecommendationRow {
  sector: string;
  label: string;
  ticker: string;
  rationale: string;
}

export interface ContextItem {
  type: "news" | "disclosure" | "policy";
  title: string;
  date: string;
  impact: string;
}

export interface AnalystRow {
  ticker: string;
  broker: string;
  date: string;
  rating: string;
  targetPrice?: number;
  summary: string;
  sourceUrl?: string;
}

export interface EventTimelineItem {
  phase: "before" | "today" | "after";
  title: string;
  bullets: Array<{ direction: string; rationale: string }>;
}

export interface SmartMoneyData {
  /** live KRX · Naver 또는 fixture */
  source?: "naver-live" | "krx-live" | "fixture";
  asOfDate?: string;
  foreignNetBuyBn: number;
  institutionNetBuyBn: number;
  sectorFlows: SectorFlowRow[];
  institutionalLens: string[];
}

export interface FxBriefingData {
  usdKrw: number;
  jpyKrw: number;
  trend: Array<{ date: string; rate: number }>;
  rebalanceTiming: string;
  rebalanceAmountKrw: number;
  rebalanceAmountUsd: number;
  rationale: string[];
}

export interface DiffRow {
  field: string;
  before: string;
  after: string;
  direction: "up" | "down" | "new" | "removed";
}

export interface Briefing {
  date: string;
  summaryLines: string[];
  totalAssetsKrw: number;
  cash: CashBalances;
  sectorTop3: Array<{
    sector: string;
    label: string;
    weightPct: number;
    flowScore: number;
  }>;
  scenarioComparison: Array<{
    id: BriefingScenarioId;
    label: string;
    expectedReturn: number;
    expectedVolatility: number;
  }>;
  fxRebalanceLine: string;
  scenarios: BriefingScenario[];
  sections: {
    portfolio: {
      returns: { d1: number; d7: number; m1: number; q1: number; ytd: number };
      caption: string;
      interpretation: string[];
    };
    fx: FxBriefingData;
    smartMoney: SmartMoneyData;
    sectorFlows: { rows: SectorFlowRow[]; inflowNote: string; outflowNote: string };
    context: { items: ContextItem[] };
    events: { timeline: EventTimelineItem[] };
    institutional: { paragraphs: string[] };
    recommendations: { rows: RecommendationRow[] };
    analyst: { reports: AnalystRow[] };
    diff?: { rows: DiffRow[]; reason: string[] };
  };
  disclaimer: string;
  status: BriefingStatus;
}

export const BRIEFING_DISCLAIMER =
  "예상 수익률·제안은 참고용이며 투자 권유가 아닙니다. 과거 데이터와 모델 추정에 기반하며 미래 수익을 보장하지 않습니다.";
