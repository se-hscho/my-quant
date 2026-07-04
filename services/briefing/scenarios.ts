import type { HoldingsSnapshot } from "@/types/agent";
import { KNOWN_TICKER_CLASSIFICATIONS } from "@/config/agent";
import type { ValuationResult } from "@/lib/agent/valuation";
import { formatKrw } from "@/lib/agent/valuation";
import {
  computePortfolioWeights,
  deltaToKrw,
  findOverweightTicker,
  normalizeWeights,
  roundWeight,
  splitTrancheAmounts,
} from "@/lib/agent/weights";
import type { BriefingScenario, BriefingScenarioId, PlaybookStep } from "./types";

import { SCENARIO_SHORT_LABELS } from "@/config/agent-scenarios";

function adjustWeights(
  before: Record<string, number>,
  deltas: Record<string, number>
): Record<string, number> {
  const after = { ...before };
  for (const [k, d] of Object.entries(deltas)) {
    after[k] = roundWeight((after[k] ?? 0) + d);
  }
  return normalizeWeights(after);
}

function sumWeights(w: Record<string, number>): number {
  return roundWeight(Object.values(w).reduce((a, b) => a + b, 0));
}

function findSemiconductorTicker(snapshot: HoldingsSnapshot): string | undefined {
  return snapshot.holdings.find(
    (h) =>
      h.sector === "semiconductor" ||
      KNOWN_TICKER_CLASSIFICATIONS[h.ticker]?.sector === "semiconductor"
  )?.ticker;
}

interface RebalancePlan {
  deltas: Record<string, number>;
  sellTicker?: string;
  sellPp?: number;
}

/** 현금 부족 시 과대 비중 종목에서 매도분을 확보 */
function planRebalanceDeltas(
  before: Record<string, number>,
  buyTicker: string,
  buyDeltaPp: number
): RebalancePlan {
  const deltas: Record<string, number> = { [buyTicker]: buyDeltaPp };
  let remaining = buyDeltaPp;

  const cashAvailable = before.CASH ?? 0;
  if (cashAvailable >= remaining) {
    deltas.CASH = roundWeight(-remaining);
    return { deltas };
  }

  if (cashAvailable > 0) {
    deltas.CASH = roundWeight(-cashAvailable);
    remaining = roundWeight(remaining - cashAvailable);
  }

  const sellTicker = findOverweightTicker(before, [buyTicker, "CASH"]);
  if (sellTicker && remaining > 0) {
    deltas[sellTicker] = roundWeight(-remaining);
    return { deltas, sellTicker, sellPp: remaining };
  }

  if (remaining > 0) {
    deltas.CASH = roundWeight((deltas.CASH ?? 0) - remaining);
  }
  return { deltas };
}

function buildSplitSteps(
  action: "buy" | "sell",
  ticker: string,
  deltaPp: number,
  totalKrw: number,
  trancheCount: number,
  frontLoad: boolean,
  startOrder: number,
  notePrefix: string
): PlaybookStep[] {
  const amountTotal = deltaToKrw(deltaPp, totalKrw);
  const amounts = splitTrancheAmounts(amountTotal, trancheCount, frontLoad);
  const ppPerTranche = roundWeight(deltaPp / trancheCount);

  return amounts.map((amountKrw, i) => ({
    order: startOrder + i,
    action,
    ticker,
    deltaPp: ppPerTranche,
    currency: playbookBuyCurrency(ticker),
    amountKrw,
    tranche: i + 1,
    trancheTotal: trancheCount,
    note: `${notePrefix} — ${i + 1}/${trancheCount}차 ${formatKrw(amountKrw)} (참고용)`,
  }));
}

function buildRebalancePlaybook(input: {
  snapshot: HoldingsSnapshot;
  totalKrw: number;
  usdKrw: number;
  buyTicker: string;
  buyDeltaPp: number;
  plan: RebalancePlan;
  trancheCount: number;
  frontLoad: boolean;
  buyNote: string;
  includeFx: boolean;
}): PlaybookStep[] {
  const steps: PlaybookStep[] = [];
  let order = 0;

  if (input.includeFx) {
    steps.push({
      order: order++,
      action: "fx",
      currency: "KRW",
      amountKrw: Math.round(5000 * input.usdKrw),
      note: `KRW→USD 환전 ${formatKrw(5000 * input.usdKrw)} 상당 — USD 매수 전 선행 (참고용)`,
    });
  }

  if (input.plan.sellTicker && input.plan.sellPp) {
    steps.push(
      ...buildSplitSteps(
        "sell",
        input.plan.sellTicker,
        input.plan.sellPp,
        input.totalKrw,
        input.trancheCount,
        false,
        order,
        `${input.plan.sellTicker} 과대 비중 조정 — 분할 매도`
      )
    );
    order += input.trancheCount;
  }

  steps.push(
    ...buildSplitSteps(
      "buy",
      input.buyTicker,
      input.buyDeltaPp,
      input.totalKrw,
      input.trancheCount,
      input.frontLoad,
      order,
      input.buyNote
    )
  );

  return steps;
}

export function buildScenarios(
  snapshot: HoldingsSnapshot,
  valuation: ValuationResult
): BriefingScenario[] {
  const totalKrw = valuation.totalKrw;
  const usdKrw = valuation.fx.usdKrw;
  const before = computePortfolioWeights(valuation);
  const usdShort = snapshot.cash.usd < 5000;
  const semiTicker = findSemiconductorTicker(snapshot) ?? "SOXX";
  const buyCurrency = playbookBuyCurrency(semiTicker);
  const needsFx = usdShort && buyCurrency === "USD";

  const base = {
    expectedVolatility: 12.5,
    assetReturn: 4.2,
    fxImpact: 0.8,
    cashAfter: { ...snapshot.cash },
    playbook: [] as BriefingScenario["playbook"],
  };

  const s0: BriefingScenario = {
    id: 0,
    label: SCENARIO_SHORT_LABELS[0],
    expectedReturn: 5.0,
    ...base,
    weightsBefore: before,
    weightsAfter: { ...before },
    playbook: [{ order: 0, action: "hold", currency: "KRW", note: "현 비중 유지 (참고용)" }],
  };

  const followPlan = planRebalanceDeltas(before, semiTicker, 5);
  const followAfter = adjustWeights(before, followPlan.deltas);

  const s1: BriefingScenario = {
    id: 1,
      label: SCENARIO_SHORT_LABELS[1],
    expectedReturn: 6.8,
    expectedVolatility: 14.2,
    assetReturn: 5.5,
    fxImpact: 1.3,
    weightsBefore: before,
    weightsAfter: followAfter,
    cashAfter: {
      ...snapshot.cash,
      usd: needsFx ? snapshot.cash.usd + 5000 : snapshot.cash.usd,
      krw: needsFx
        ? Math.max(0, snapshot.cash.krw - 5000 * usdKrw)
        : snapshot.cash.krw,
    },
    playbook: buildRebalancePlaybook({
      snapshot,
      totalKrw,
      usdKrw,
      buyTicker: semiTicker,
      buyDeltaPp: 5,
      plan: followPlan,
      trancheCount: 3,
      frontLoad: false,
      buyNote: "반도체 Follow — 균등 3분할 매수",
      includeFx: needsFx,
    }),
  };

  const leadPlan = planRebalanceDeltas(before, semiTicker, 8);
  const leadAfter = adjustWeights(before, leadPlan.deltas);

  const s2: BriefingScenario = {
    id: 2,
    label: SCENARIO_SHORT_LABELS[2],
    expectedReturn: 8.1,
    expectedVolatility: 17.5,
    assetReturn: 6.8,
    fxImpact: 1.3,
    weightsBefore: before,
    weightsAfter: leadAfter,
    cashAfter: s1.cashAfter,
    playbook: buildRebalancePlaybook({
      snapshot,
      totalKrw,
      usdKrw,
      buyTicker: semiTicker,
      buyDeltaPp: 8,
      plan: leadPlan,
      trancheCount: 3,
      frontLoad: true,
      buyNote: "선점 — 선행 50·30·20 분할 매수",
      includeFx: needsFx,
    }),
  };

  const overweight = findOverweightTicker(before, ["CASH"]);
  const minDeltas: Record<string, number> = { CASH: 2 };
  if (overweight) minDeltas[overweight] = -2;
  else minDeltas[semiTicker] = -2;
  const minAfter = adjustWeights(before, minDeltas);

  const minSellTicker = overweight ?? semiTicker;
  const minPlaybook: PlaybookStep[] = [
    {
      order: 0,
      action: "fx",
      currency: "KRW",
      amountKrw: Math.round(5000 * usdKrw),
      note: "환전만 선행 — 매수·매도는 이벤트 이후 검토 (참고용)",
    },
  ];
  if (overweight) {
    minPlaybook.push(
      ...buildSplitSteps(
        "sell",
        minSellTicker,
        2,
        totalKrw,
        2,
        false,
        1,
        `${minSellTicker} 과대 비중 — 소량 분할 매도`
      )
    );
  }

  const s3: BriefingScenario = {
    id: 3,
    label: SCENARIO_SHORT_LABELS[3],
    expectedReturn: 5.4,
    expectedVolatility: 12.8,
    assetReturn: 4.5,
    fxImpact: 0.9,
    weightsBefore: before,
    weightsAfter: minAfter,
    cashAfter: snapshot.cash,
    playbook: minPlaybook,
  };

  return [s0, s1, s2, s3];
}

export function validateScenarioWeights(scenario: BriefingScenario): boolean {
  const sum = sumWeights(scenario.weightsAfter);
  return Math.abs(sum - 100) <= 0.1;
}

export function playbookBuyCurrency(ticker: string) {
  if (ticker.endsWith(".KS")) return "KRW" as const;
  if (ticker.endsWith(".T")) return "JPY" as const;
  return "USD" as const;
}

export function validatePlaybookCurrencyRules(scenario: BriefingScenario): boolean {
  for (const step of scenario.playbook) {
    if ((step.action === "buy" || step.action === "sell") && step.ticker) {
      const expected = playbookBuyCurrency(step.ticker);
      if (step.currency !== expected) return false;
    }
  }
  return true;
}

export function scenarioHasSplitTrades(scenario: BriefingScenario): boolean {
  return scenario.playbook.some(
    (s) =>
      (s.action === "buy" || s.action === "sell") &&
      s.trancheTotal != null &&
      s.trancheTotal > 1
  );
}

export function scenarioHasSellSteps(scenario: BriefingScenario): boolean {
  return scenario.playbook.some((s) => s.action === "sell");
}
