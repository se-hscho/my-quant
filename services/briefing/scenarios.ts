import type { CashBalances, Currency, HoldingsSnapshot } from "@/types/agent";
import { AGENT_SECTOR_LABELS, KNOWN_TICKER_CLASSIFICATIONS, type AgentSectorId } from "@/config/agent";
import type { BriefingScenario, BriefingScenarioId } from "./types";

const SCENARIO_LABELS: Record<BriefingScenarioId, string> = {
  0: "유지",
  1: "Follow",
  2: "선점",
  3: "최소변경",
};

function holdingWeights(snapshot: HoldingsSnapshot, totalKrw: number): Record<string, number> {
  if (totalKrw <= 0) return {};
  const n = Math.max(snapshot.holdings.length, 1);
  const weights: Record<string, number> = {};
  for (const h of snapshot.holdings) {
    weights[h.ticker] = Math.round((100 / n) * 10) / 10;
  }
  const sum = Object.values(weights).reduce((a, b) => a + b, 0);
  const cashPct = Math.max(0, 100 - sum);
  if (cashPct > 0) weights["CASH"] = Math.round(cashPct * 10) / 10;
  return weights;
}

function adjustWeights(
  before: Record<string, number>,
  deltas: Record<string, number>
): Record<string, number> {
  const after = { ...before };
  for (const [k, d] of Object.entries(deltas)) {
    after[k] = Math.round(((after[k] ?? 0) + d) * 10) / 10;
  }
  const sum = Object.values(after).reduce((a, b) => a + b, 0);
  const diff = 100 - sum;
  if (Math.abs(diff) > 0.05) {
    after.CASH = Math.round(((after.CASH ?? 0) + diff) * 10) / 10;
  }
  return after;
}

function sumWeights(w: Record<string, number>): number {
  return Math.round(Object.values(w).reduce((a, b) => a + b, 0) * 10) / 10;
}

export function buildScenarios(
  snapshot: HoldingsSnapshot,
  totalKrw: number,
  usdKrw: number
): BriefingScenario[] {
  const before = holdingWeights(snapshot, totalKrw);
  const usdShort = snapshot.cash.usd < 5000;

  const base = {
    expectedVolatility: 12.5,
    assetReturn: 4.2,
    fxImpact: 0.8,
    cashAfter: { ...snapshot.cash },
    playbook: [] as BriefingScenario["playbook"],
  };

  const s0: BriefingScenario = {
    id: 0,
    label: SCENARIO_LABELS[0],
    expectedReturn: 5.0,
    ...base,
    weightsBefore: before,
    weightsAfter: { ...before },
    playbook: [{ order: 0, action: "hold", currency: "KRW", note: "현 비중 유지 (참고용)" }],
  };

  const followBefore = { ...before };
  const followDeltas: Record<string, number> = {};
  const semiTicker = snapshot.holdings.find(
    (h) =>
      h.sector === "semiconductor" ||
      KNOWN_TICKER_CLASSIFICATIONS[h.ticker]?.sector === "semiconductor"
  )?.ticker;
  if (semiTicker) followDeltas[semiTicker] = 5;
  else followDeltas.SOXX = 5;
  followDeltas.CASH = -5;
  const followAfter = adjustWeights(followBefore, followDeltas);

  const followPlaybook: BriefingScenario["playbook"] = [];
  if (usdShort) {
    followPlaybook.push({
      order: 0,
      action: "fx",
      currency: "KRW",
      note: `KRW→USD 환전 약 ${Math.round(5000 * usdKrw).toLocaleString("ko-KR")}원 상당 (참고용)`,
    });
  }
  followPlaybook.push({
    order: followPlaybook.length,
    action: "buy",
    ticker: semiTicker ?? "SOXX",
    deltaPp: 5,
    currency: playbookBuyCurrency(semiTicker ?? "SOXX"),
    note: "반도체 Follow 확대 검토",
  });

  const s1: BriefingScenario = {
    id: 1,
    label: SCENARIO_LABELS[1],
    expectedReturn: 6.8,
    expectedVolatility: 14.2,
    assetReturn: 5.5,
    fxImpact: 1.3,
    weightsBefore: followBefore,
    weightsAfter: followAfter,
    cashAfter: {
      ...snapshot.cash,
      usd: usdShort ? snapshot.cash.usd + 5000 : snapshot.cash.usd,
      krw: usdShort ? Math.max(0, snapshot.cash.krw - 5000 * usdKrw) : snapshot.cash.krw,
    },
    playbook: followPlaybook,
  };

  const leadAfter = adjustWeights(followBefore, { ...followDeltas, [Object.keys(followDeltas)[0]]: 8 });
  const s2: BriefingScenario = {
    id: 2,
    label: SCENARIO_LABELS[2],
    expectedReturn: 8.1,
    expectedVolatility: 17.5,
    assetReturn: 6.8,
    fxImpact: 1.3,
    weightsBefore: followBefore,
    weightsAfter: leadAfter,
    cashAfter: s1.cashAfter,
    playbook: [
      ...(usdShort ? s1.playbook.filter((p) => p.action === "fx") : []),
      {
        order: 1,
        action: "buy",
        ticker: semiTicker ?? "SOXX",
        deltaPp: 8,
        currency: playbookBuyCurrency(semiTicker ?? "SOXX"),
        note: "선점 — 수급 강세 구간 검토",
      },
    ],
  };

  const minAfter = adjustWeights(followBefore, { CASH: 2, [Object.keys(followDeltas)[0]]: -2 });
  const s3: BriefingScenario = {
    id: 3,
    label: SCENARIO_LABELS[3],
    expectedReturn: 5.4,
    expectedVolatility: 12.8,
    assetReturn: 4.5,
    fxImpact: 0.9,
    weightsBefore: followBefore,
    weightsAfter: minAfter,
    cashAfter: snapshot.cash,
    playbook: [
      {
        order: 0,
        action: "fx",
        currency: "KRW",
        note: "환전만 선행, 매수는 이벤트 이후 검토 (참고용)",
      },
    ],
  };

  return [s0, s1, s2, s3];
}

export function validateScenarioWeights(scenario: BriefingScenario): boolean {
  const sum = sumWeights(scenario.weightsAfter);
  return Math.abs(sum - 100) <= 0.1;
}

export function playbookBuyCurrency(ticker: string): Currency {
  if (ticker.endsWith(".KS")) return "KRW";
  if (ticker.endsWith(".T")) return "JPY";
  return "USD";
}

export function validatePlaybookCurrencyRules(scenario: BriefingScenario): boolean {
  for (const step of scenario.playbook) {
    if (step.action === "buy" && step.ticker) {
      const expected = playbookBuyCurrency(step.ticker);
      if (step.currency !== expected) return false;
    }
  }
  return true;
}
