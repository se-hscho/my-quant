import {
  INFLOW_THRESHOLD,
  OUTFLOW_THRESHOLD,
  RETURN_CUT_LOSS_PCT,
  RETURN_DIP_BUY_PCT,
  RETURN_TAKE_PROFIT_PCT,
} from "@/config/agent-analysis-guide";
import type { HoldingValuation } from "./valuation";

export type ReturnActionHint = "take_profit" | "cut_loss" | "dip_add" | "hold_loss" | "none";

export interface ReturnSignal {
  ticker: string;
  returnPct: number;
  pnlKrw?: number;
  hint: ReturnActionHint;
  reason: string;
}

export function classifyReturnSignal(
  holding: HoldingValuation,
  sectorFlowScore?: number
): ReturnSignal | null {
  if (holding.returnPct == null || !Number.isFinite(holding.returnPct)) {
    return null;
  }

  const { returnPct, ticker, pnlKrw } = holding;
  const inflow = sectorFlowScore != null && sectorFlowScore > INFLOW_THRESHOLD;
  const outflow = sectorFlowScore != null && sectorFlowScore < OUTFLOW_THRESHOLD;

  if (returnPct >= RETURN_TAKE_PROFIT_PCT) {
    return {
      ticker,
      returnPct,
      pnlKrw,
      hint: "take_profit",
      reason: `수익률 +${returnPct.toFixed(1)}% — 과대 비중과 겹치면 분할 차익실현 검토 (참고용)`,
    };
  }

  if (returnPct <= RETURN_CUT_LOSS_PCT) {
    if (outflow) {
      return {
        ticker,
        returnPct,
        pnlKrw,
        hint: "cut_loss",
        reason: `수익률 ${returnPct.toFixed(1)}% + 섹터 유출 — 축소·손절 검토 (참고용)`,
      };
    }
    return {
      ticker,
      returnPct,
      pnlKrw,
      hint: "hold_loss",
      reason: `수익률 ${returnPct.toFixed(1)}% — 유입 섹터면 추가 매수보다 회복 관찰 우선 (참고용)`,
    };
  }

  if (returnPct <= RETURN_DIP_BUY_PCT && inflow) {
    return {
      ticker,
      returnPct,
      pnlKrw,
      hint: "dip_add",
      reason: `수익률 ${returnPct.toFixed(1)}% + 섹터 유입 — 분할 추가 매수 검토 (참고용)`,
    };
  }

  return null;
}

export function formatReturnPct(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}
