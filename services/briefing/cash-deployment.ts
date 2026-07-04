import { evidenceLinks } from "@/config/evidence-sources";
import {
  DEPLOYMENT_TEMPLATES,
  resolveStarterTicker,
} from "@/config/starter-portfolios";
import { preferKrMarket } from "@/lib/agent/snapshot-mode";
import type { ValuationResult } from "@/lib/agent/valuation";
import { formatKrw } from "@/lib/agent/valuation";
import { roundWeight, splitTrancheAmounts } from "@/lib/agent/weights";
import type { HoldingsSnapshot } from "@/types/agent";
import type {
  InvestmentDirectionSection,
  PortfolioCombination,
  PortfolioCombinationTicker,
} from "@/types/deployment";
import type { BriefingScenario, BriefingScenarioId, ContextItem, PlaybookStep, SmartMoneyData } from "./types";
import { playbookBuyCurrency } from "./scenarios";

const SCENARIO_LABELS: Record<BriefingScenarioId, string> = {
  0: "유지",
  1: "Follow",
  2: "선점",
  3: "최소변경",
};

const TEMPLATE_BY_SCENARIO: Record<BriefingScenarioId, keyof typeof DEPLOYMENT_TEMPLATES | null> = {
  0: null,
  1: "follow",
  2: "lead",
  3: "minimal",
};

function topInflowSectors(smartMoney: SmartMoneyData, n = 2): string[] {
  return smartMoney.sectorFlows
    .toSorted((a, b) => b.flowScore - a.flowScore)
    .slice(0, n)
    .map((s) => s.label);
}

function buildMarketNarrative(
  smartMoney: SmartMoneyData,
  context: ContextItem[]
): string[] {
  const inflow = topInflowSectors(smartMoney).join("·");
  const foreign = smartMoney.foreignNetBuyBn;
  const inst = smartMoney.institutionNetBuyBn;
  return [
    `외국인 순매수 ${foreign >= 0 ? "+" : ""}${foreign.toFixed(2)}조·기관 ${inst >= 0 ? "+" : ""}${inst.toFixed(2)}조 참고 — 유입 상위 ${inflow} 섹터와 정합 (참고용).`,
    context.find((c) => c.type === "news")?.impact ??
      "섹터 상대강도와 수급 데이터를 Follow·선점 배분에 반영했습니다.",
  ];
}

function buildPolicyNarrative(context: ContextItem[]): string[] {
  const policy = context.filter((c) => c.type === "policy" || c.type === "disclosure");
  if (policy.length === 0) {
    return ["정책·이벤트 캘린더를 확인한 뒤 분할 매수 속도를 조절하세요 (참고용)."];
  }
  return policy.map((p) => `${p.title} — ${p.impact}`);
}

function allocationLinesToTickers(
  template: (typeof DEPLOYMENT_TEMPLATES)["follow"],
  totalKrw: number,
  preferKr: boolean
): PortfolioCombinationTicker[] {
  const deployKrw = Math.round((totalKrw * template.deployPct) / 100);
  const sectorCount = new Map<string, number>();

  return template.lines.map((line) => {
    const idx = (sectorCount.get(line.sector) ?? 0) + 1;
    sectorCount.set(line.sector, idx);
    const { ticker, label } = resolveStarterTicker(line.sector, preferKr, idx);
    const amountKrw = Math.round((deployKrw * line.weightPct) / 100);
    return {
      ticker,
      label,
      weightPct: roundWeight((amountKrw / totalKrw) * 100),
      amountKrw,
      role: line.role,
    };
  });
}

function splitBuyGuide(
  tranches: number,
  frontLoad: boolean,
  scheduleWeeks: number[]
): PortfolioCombination["splitBuy"] {
  return {
    method: frontLoad ? "선행 50·30·20" : "균등 3분할",
    tranches,
    scheduleWeeks,
    note: `${scheduleWeeks.join("·")}주차에 걸쳐 ${tranches}회 분할 매수 검토 (참고용)`,
  };
}

function holdGuideForScenario(id: BriefingScenarioId): PortfolioCombination["holdGuide"] {
  if (id === 2) {
    return {
      reviewHorizon: "4주마다 점검",
      holdUntil: "유입 섹터 7일 상대강도가 +5%p 이하로 둔화할 때까지 코어 유지 검토",
      rebalanceTriggers: [
        "선택 조합 내 단일 종목 비중이 35%를 초과",
        "반도체·기술 섹터 flowScore가 0.4 아래로 하락",
        "FOMC·CPI 등 거시 이벤트 전후 변동성 확대",
        "분할 매수 3차 완료 후 잔여 현금 15%p 이상이 8주 지속",
      ],
    };
  }
  if (id === 3) {
    return {
      reviewHorizon: "분기(3개월)마다 점검",
      holdUntil: "첫 분할 매수 완료 후 6개월 — 이벤트 통과 전까지 급격한 추가 배분 보류",
      rebalanceTriggers: [
        "유입 섹터가 유출로 전환(flowScore 0.4 미만)",
        "환율 7일 변동 ±3% 초과 시 USD 매수 속도 조절",
        "채권·현금 비중이 목표 대비 +10%p 이탈",
      ],
    };
  }
  return {
    reviewHorizon: "6~8주마다 점검",
    holdUntil: "분할 매수 완료 후 12개월 — 중기 추세 유지 시 코어 비중 유지 검토",
    rebalanceTriggers: [
      "포트폴리오 섹터 비중이 제안 대비 ±8%p 이탈",
      "유입 상위 섹터가 2주 연속 flowScore 하락",
      "단일 ETF·종목 손실 -15% — 다음 분할 차수 보류 검토",
      "분기 실적 시즌 — 안 3(최소변경)으로 속도 전환 검토",
    ],
  };
}

function buildCombination(
  id: BriefingScenarioId,
  templateKey: keyof typeof DEPLOYMENT_TEMPLATES,
  totalKrw: number,
  preferKr: boolean,
  smartMoney: SmartMoneyData,
  context: ContextItem[]
): PortfolioCombination {
  const template = DEPLOYMENT_TEMPLATES[templateKey];
  const tickers = allocationLinesToTickers(template, totalKrw, preferKr);
  const frontLoad = templateKey === "lead";
  const tranches = templateKey === "minimal" ? 2 : 3;
  const weeks = templateKey === "minimal" ? [2, 6] : frontLoad ? [1, 3, 5] : [2, 4, 6];

  const inflow = topInflowSectors(smartMoney).join("·");
  const marketRationale =
    templateKey === "lead"
      ? `${inflow} 유입 가속 — 선행 분할로 선점 속도를 높인 조합 (참고용)`
      : templateKey === "minimal"
        ? `이벤트·변동성 대비 — 소량 코어 + 현금 ${template.cashReservePct}% 유지 (참고용)`
        : `${inflow} Follow — 균형형 코어 + 채권 완충 (참고용)`;

  return {
    id: `combo-${id}`,
    label: `${SCENARIO_LABELS[id]} — ${templateKey === "lead" ? "성장·선점" : templateKey === "minimal" ? "방어·소량" : "균형·Follow"} 조합`,
    scenarioId: id,
    description: `총 ${formatKrw(totalKrw)} 중 약 ${template.deployPct}% (${formatKrw(Math.round((totalKrw * template.deployPct) / 100))})를 ${tranches}회 분할 배분`,
    marketRationale,
    tickers,
    splitBuy: splitBuyGuide(tranches, frontLoad, weeks),
    holdGuide: holdGuideForScenario(id),
    evidenceLinks: evidenceLinks(
      "naverInvestorFlow",
      "yahooFx",
      context.some((c) => c.type === "policy") ? "fedCalendar" : "dartKr"
    ),
  };
}

export function buildInvestmentDirection(input: {
  snapshot: HoldingsSnapshot;
  valuation: ValuationResult;
  smartMoney: SmartMoneyData;
  context: ContextItem[];
}): InvestmentDirectionSection {
  const totalKrw = input.valuation.totalKrw;
  const preferKr = preferKrMarket(input.snapshot);
  const marketNarrative = buildMarketNarrative(input.smartMoney, input.context);
  const policyNarrative = buildPolicyNarrative(input.context);

  const combinations = [
    buildCombination(1, "follow", totalKrw, preferKr, input.smartMoney, input.context),
    buildCombination(2, "lead", totalKrw, preferKr, input.smartMoney, input.context),
    buildCombination(3, "minimal", totalKrw, preferKr, input.smartMoney, input.context),
  ];

  const recommendedScenarioId: BriefingScenarioId = 1;
  const recommendedReason =
    "현금 100% 상태 — 급격한 일괄 매수보다 Follow 균등 3분할로 유입 섹터에 단계적 진입을 검토 (참고용).";

  return {
    mode: "deployment",
    headline: `${formatKrw(totalKrw)} 투자 재원 — 시장·정책 맥락 기반 배분 방향`,
    totalDeployableKrw: totalKrw,
    marketNarrative,
    policyNarrative,
    recommendedScenarioId,
    recommendedScenarioLabel: SCENARIO_LABELS[recommendedScenarioId],
    recommendedReason,
    combinations,
    evidenceLinks: evidenceLinks("naverInvestorFlow", "fedCalendar", "dartKr", "yahooFx"),
  };
}

function weightsFromCombination(
  combo: PortfolioCombination,
  cashReservePct: number
): Record<string, number> {
  const weights: Record<string, number> = { CASH: cashReservePct };
  for (const t of combo.tickers) {
    weights[t.ticker] = roundWeight((weights[t.ticker] ?? 0) + t.weightPct);
  }
  return roundWeightRecord(weights);
}

function roundWeightRecord(w: Record<string, number>): Record<string, number> {
  const sum = Object.values(w).reduce((a, b) => a + b, 0);
  const diff = 100 - sum;
  if (Math.abs(diff) > 0.05) {
    w.CASH = roundWeight((w.CASH ?? 0) + diff);
  }
  return w;
}

function buildDeploymentPlaybook(
  combo: PortfolioCombination,
  totalKrw: number,
  usdKrw: number,
  snapshot: HoldingsSnapshot
): PlaybookStep[] {
  const steps: PlaybookStep[] = [];
  let order = 0;
  const { tranches, scheduleWeeks } = combo.splitBuy;
  const frontLoad = combo.splitBuy.method.includes("선행");

  const usdNeeded = combo.tickers
    .filter((t) => playbookBuyCurrency(t.ticker) === "USD")
    .reduce((s, t) => s + t.amountKrw, 0);

  if (usdNeeded > 0 && snapshot.cash.usd < usdNeeded / usdKrw) {
    steps.push({
      order: order++,
      action: "fx",
      currency: "KRW",
      amountKrw: Math.round(usdNeeded * 0.35),
      note: `1차 환전 — USD 매수분의 약 35% (${scheduleWeeks[0]}주차, 참고용)`,
    });
  }

  for (const t of combo.tickers) {
    const amounts = splitTrancheAmounts(t.amountKrw, tranches, frontLoad);
    const ppPer = roundWeight(t.weightPct / tranches);

    amounts.forEach((amountKrw, i) => {
      steps.push({
        order: order++,
        action: "buy",
        ticker: t.ticker,
        deltaPp: ppPer,
        currency: playbookBuyCurrency(t.ticker),
        amountKrw,
        tranche: i + 1,
        trancheTotal: tranches,
        note: `${t.label} ${i + 1}/${tranches}차 — ${scheduleWeeks[i] ?? i + 2}주차 ${formatKrw(amountKrw)} (참고용)`,
      });
    });
  }

  return steps;
}

export function buildCashDeploymentScenarios(input: {
  snapshot: HoldingsSnapshot;
  valuation: ValuationResult;
  direction: InvestmentDirectionSection;
}): BriefingScenario[] {
  const before: Record<string, number> = { CASH: 100 };
  const { snapshot, valuation } = input;
  const usdKrw = valuation.fx.usdKrw;

  const base = {
    expectedVolatility: 12.5,
    assetReturn: 4.2,
    fxImpact: 0.8,
    cashAfter: { ...snapshot.cash },
  };

  const s0: BriefingScenario = {
    id: 0,
    label: SCENARIO_LABELS[0],
    expectedReturn: 2.0,
    ...base,
    weightsBefore: before,
    weightsAfter: { ...before },
    playbook: [
      {
        order: 0,
        action: "hold",
        currency: "KRW",
        note: "현금 100% 유지 — 배분 시점 관망 (참고용)",
      },
    ],
  };

  const scenarioIds: BriefingScenarioId[] = [1, 2, 3];
  const returns = [
    { expectedReturn: 6.5, vol: 14, asset: 5.2, fx: 1.3 },
    { expectedReturn: 7.8, vol: 17, asset: 6.5, fx: 1.3 },
    { expectedReturn: 4.8, vol: 11, asset: 4.0, fx: 0.8 },
  ];

  const built = scenarioIds.map((id, idx) => {
    const combo = input.direction.combinations.find((c) => c.scenarioId === id)!;
    const templateKey = TEMPLATE_BY_SCENARIO[id]!;
    const template = DEPLOYMENT_TEMPLATES[templateKey];
    const after = weightsFromCombination(combo, template.cashReservePct);
    const playbook = buildDeploymentPlaybook(combo, valuation.totalKrw, usdKrw, snapshot);
    const r = returns[idx];

    const usdBuyKrw = combo.tickers
      .filter((t) => playbookBuyCurrency(t.ticker) === "USD")
      .reduce((s, t) => s + t.amountKrw, 0);

    return {
      id,
      label: SCENARIO_LABELS[id],
      expectedReturn: r.expectedReturn,
      expectedVolatility: r.vol,
      assetReturn: r.asset,
      fxImpact: r.fx,
      weightsBefore: before,
      weightsAfter: after,
      cashAfter: {
        ...snapshot.cash,
        krw: Math.max(0, snapshot.cash.krw - usdBuyKrw * 0.35),
        usd: snapshot.cash.usd + usdBuyKrw / usdKrw,
      },
      playbook,
    } satisfies BriefingScenario;
  });

  return [s0, ...built];
}

export function deploymentSummaryLines(
  direction: InvestmentDirectionSection,
  totalKrw: number
): string[] {
  const combo = direction.combinations[0];
  const tickers = combo.tickers.map((t) => `${t.ticker} ${t.weightPct}%`).join(", ");
  return [
    direction.headline,
    `시장 맥락: ${direction.marketNarrative[0]}`,
    `정책·이벤트: ${direction.policyNarrative[0]}`,
    `권장 안 ${direction.recommendedScenarioId}(${direction.recommendedScenarioLabel}) — ${direction.recommendedReason}`,
    `Follow 조합 예: ${tickers} · ${combo.splitBuy.note}`,
    `보유 가이드: ${combo.holdGuide.reviewHorizon} 점검, ${combo.holdGuide.rebalanceTriggers[0]}`,
    "상세 레포트에서 조합별 금액·분할 일정·근거 링크를 확인하세요.",
  ];
}
