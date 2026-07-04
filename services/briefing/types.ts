import type { CashBalances, Currency } from "@/types/agent";
import type {
  AnalysisGuideSnapshot,
  AnalysisLayerId,
  RecommendationAction,
  RecommendationGuideRow,
} from "@/types/analysis-guide";
import type { InvestmentDirectionSection } from "@/types/deployment";

export type BriefingScenarioId = 0 | 1 | 2 | 3;
export type BriefingStatus = "complete" | "failed" | "partial";

export interface PlaybookStep {
  order: number;
  action: "fx" | "sell" | "buy" | "hold";
  ticker?: string;
  deltaPp?: number;
  currency: Currency;
  /** KRW 환산 참고 금액 */
  amountKrw?: number;
  /** 분할 실행 — n번째 */
  tranche?: number;
  /** 분할 총 횟수 */
  trancheTotal?: number;
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

export type { AnalysisGuideSnapshot, AnalysisLayerId, RecommendationAction };
export type RecommendationRow = RecommendationGuideRow;

export interface ContextItem {
  type: "news" | "disclosure" | "policy";
  title: string;
  date: string;
  impact: string;
  sourceUrl?: string;
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
      /** 매수가 입력 종목의 수익률 요약 */
      holdingsReturnPct?: number;
      holdingsPnlKrw?: number;
      caption: string;
      interpretation: string[];
    };
    fx: FxBriefingData;
    smartMoney: SmartMoneyData;
    sectorFlows: { rows: SectorFlowRow[]; inflowNote: string; outflowNote: string };
    context: { items: ContextItem[] };
    events: { timeline: EventTimelineItem[] };
    institutional: { paragraphs: string[] };
    analysisGuide: AnalysisGuideSnapshot;
    investmentDirection?: InvestmentDirectionSection;
    recommendations: { rows: RecommendationRow[] };
    analyst: { reports: AnalystRow[] };
    diff?: { rows: DiffRow[]; reason: string[] };
  };
  disclaimer: string;
  status: BriefingStatus;
}

export const BRIEFING_DISCLAIMER =
  "예상 수익률·제안은 참고용이며 투자 권유가 아닙니다. 과거 데이터와 모델 추정에 기반하며 미래 수익을 보장하지 않습니다.";
