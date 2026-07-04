export type DeploymentScenarioId = 0 | 1 | 2 | 3;

export interface EvidenceLink {
  title: string;
  url: string;
  type: "policy" | "news" | "market_data" | "disclosure" | "analyst";
}

export interface PortfolioCombinationTicker {
  ticker: string;
  label: string;
  weightPct: number;
  amountKrw: number;
  role: string;
}

export interface SplitBuyGuide {
  method: string;
  tranches: number;
  scheduleWeeks: number[];
  note: string;
}

export interface HoldGuide {
  reviewHorizon: string;
  holdUntil: string;
  rebalanceTriggers: string[];
}

export interface PortfolioCombination {
  id: string;
  label: string;
  scenarioId: DeploymentScenarioId;
  description: string;
  marketRationale: string;
  tickers: PortfolioCombinationTicker[];
  splitBuy: SplitBuyGuide;
  holdGuide: HoldGuide;
  evidenceLinks: EvidenceLink[];
}

export interface InvestmentDirectionSection {
  mode: "deployment" | "rebalance";
  headline: string;
  totalDeployableKrw: number;
  marketNarrative: string[];
  policyNarrative: string[];
  recommendedScenarioId: DeploymentScenarioId;
  recommendedScenarioLabel: string;
  recommendedReason: string;
  combinations: PortfolioCombination[];
  evidenceLinks: EvidenceLink[];
}
