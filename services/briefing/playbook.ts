import type { BriefingScenario, PlaybookStep } from "./types";

export function formatPlaybookSteps(scenario: BriefingScenario): string[] {
  return scenario.playbook
    .toSorted((a, b) => a.order - b.order)
    .map((step) => {
      const parts = [`${step.order}단계`, step.action.toUpperCase()];
      if (step.ticker) parts.push(step.ticker);
      if (step.deltaPp != null) parts.push(`${step.deltaPp > 0 ? "+" : ""}${step.deltaPp}%p`);
      if (step.tranche != null && step.trancheTotal != null && step.trancheTotal > 1) {
        parts.push(`${step.tranche}/${step.trancheTotal}차`);
      }
      if (step.amountKrw != null) {
        parts.push(`${step.amountKrw.toLocaleString("ko-KR")}원`);
      }
      parts.push(step.currency);
      if (step.note) parts.push(`— ${step.note}`);
      return parts.join(" ");
    });
}

export function isFxOnlyPlaybook(scenario: BriefingScenario): boolean {
  const actions = scenario.playbook.map((p) => p.action);
  return actions.includes("fx") && !actions.includes("buy");
}

export function countSplitTrades(steps: PlaybookStep[]): number {
  return steps.filter(
    (s) =>
      (s.action === "buy" || s.action === "sell") &&
      s.trancheTotal != null &&
      s.trancheTotal > 1
  ).length;
}
