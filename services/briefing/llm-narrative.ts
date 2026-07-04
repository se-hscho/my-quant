import { AGENT_SECTOR_LABELS, type AgentSectorId } from "@/config/agent";
import {
  ASSET_CLASS_LABELS,
  computeAssetClassWeights,
  computeSubSectorWeights,
  type AssetClassId,
} from "@/lib/agent/asset-classes";
import type { WeightRow } from "@/lib/agent/asset-classes";
import { formatTrendPct } from "@/lib/agent/price-trends";
import type { ValuationResult } from "@/lib/agent/valuation";
import { resolveHoldingSector } from "@/lib/agent/weights";
import type { HoldingsSnapshot } from "@/types/agent";
import { generateGeminiJson, isGeminiConfigured } from "@/services/ai/gemini";
import type { SmartMoneyData } from "./types";

export interface HoldingInsightRow {
  ticker: string;
  name?: string;
  sectorLabel: string;
  valueKrw: number;
  returnPct?: number;
  pnlKrw?: number;
  weightPct?: number;
  trend?: { d1: number | null; d7: number | null; m1: number | null };
}

export interface LlmBriefingNarrative {
  source: "gemini";
  model: string;
  executiveLines: string[];
  assetClassAnalysis: string;
  subSectorAnalysis: string;
  holdings: Array<{
    ticker: string;
    marketContext: string;
    trendRead: string;
    weightAction: string;
    outlook: string;
  }>;
}

const NARRATIVE_PROMPT = `당신은 포트폴리오 분석 리포트 작성자입니다. 투자 권유·매수·매도 지시는 금지합니다.
입력 데이터(평가·수익·가격 추세·섹터·자산군)를 바탕으로 **종목·섹터별로 다른** 맥락 있는 분석을 작성하세요.
모든 종목에 같은 문구를 반복하지 마세요. 해당 섹터 시장 상황·가격 추세·손익 구간을 연결하세요.

JSON 출력:
{
  "executiveLines": string[3-5],
  "assetClassAnalysis": string,
  "subSectorAnalysis": string,
  "holdings": [{
    "ticker": string,
    "marketContext": string,
    "trendRead": string,
    "weightAction": string,
    "outlook": string
  }]
}`;

export function buildHoldingInsightRows(input: {
  snapshot: HoldingsSnapshot;
  valuation: ValuationResult;
  trendsByTicker: Record<string, { d1: number | null; d7: number | null; m1: number | null } | null>;
}): HoldingInsightRow[] {
  const total = input.valuation.totalKrw;
  return input.valuation.holdings.map((h) => {
    const snap = input.snapshot.holdings.find((s) => s.id === h.id || s.ticker === h.ticker);
    const sector = resolveHoldingSector(h.ticker, snap?.sector);
    const sectorLabel =
      sector === "other"
        ? "기타"
        : (AGENT_SECTOR_LABELS[sector as AgentSectorId] ?? sector);
    return {
      ticker: h.ticker,
      name: snap?.ticker,
      sectorLabel,
      valueKrw: h.valueKrw,
      returnPct: h.returnPct,
      pnlKrw: h.pnlKrw,
      weightPct: total > 0 ? (h.valueKrw / total) * 100 : 0,
      trend: input.trendsByTicker[h.ticker.toUpperCase()] ?? undefined,
    };
  });
}

function formatWeightRows(rows: WeightRow[]): string {
  return rows.map((r) => `${r.label} ${r.weightPct}%`).join(", ");
}

export async function generateLlmBriefingNarrative(input: {
  snapshot: HoldingsSnapshot;
  valuation: ValuationResult;
  smartMoney: SmartMoneyData;
  holdings: HoldingInsightRow[];
  portfolioReturns: { d1: number; d7: number; m1: number };
}): Promise<LlmBriefingNarrative | null> {
  if (!isGeminiConfigured()) return null;

  const assetClasses = computeAssetClassWeights(input.valuation, input.snapshot);
  const subSectors = computeSubSectorWeights(input.valuation, input.snapshot);

  const payload = {
    totalKrw: Math.round(input.valuation.totalKrw),
    holdingsReturnPct: input.valuation.holdingsReturnPct,
    holdingsPnlKrw: input.valuation.holdingsPnlKrw,
    portfolioReturns: input.portfolioReturns,
    assetClasses: assetClasses.map((r) => ({ class: r.label, pct: r.weightPct })),
    subSectors: subSectors.map((r) => ({ sector: r.label, pct: r.weightPct })),
    sectorFlows: input.smartMoney.sectorFlows.slice(0, 6),
    holdings: input.holdings.map((h) => ({
      ticker: h.ticker,
      sector: h.sectorLabel,
      weightPct: h.weightPct?.toFixed(1),
      valueKrw: Math.round(h.valueKrw),
      returnPct: h.returnPct?.toFixed(1),
      pnlKrw: h.pnlKrw != null ? Math.round(h.pnlKrw) : null,
      trend: h.trend
        ? {
            d1: formatTrendPct(h.trend.d1),
            d7: formatTrendPct(h.trend.d7),
            m1: formatTrendPct(h.trend.m1),
          }
        : null,
    })),
  };

  const result = await generateGeminiJson<{
    executiveLines?: string[];
    assetClassAnalysis?: string;
    subSectorAnalysis?: string;
    holdings?: Array<{
      ticker?: string;
      marketContext?: string;
      trendRead?: string;
      weightAction?: string;
      outlook?: string;
    }>;
  }>(NARRATIVE_PROMPT, JSON.stringify(payload, null, 2));

  if (!result.ok || !result.data.executiveLines?.length) return null;

  return {
    source: "gemini",
    model: result.model,
    executiveLines: result.data.executiveLines.slice(0, 6),
    assetClassAnalysis: result.data.assetClassAnalysis ?? formatWeightRows(assetClasses),
    subSectorAnalysis: result.data.subSectorAnalysis ?? formatWeightRows(subSectors),
    holdings: (result.data.holdings ?? [])
      .filter((h) => h.ticker)
      .map((h) => ({
        ticker: h.ticker!,
        marketContext: h.marketContext ?? "",
        trendRead: h.trendRead ?? "",
        weightAction: h.weightAction ?? "",
        outlook: h.outlook ?? "",
      })),
  };
}

export { ASSET_CLASS_LABELS, type AssetClassId };
