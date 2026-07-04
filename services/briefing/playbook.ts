import type { BriefingScenario } from "./types";

export function formatPlaybookSteps(scenario: BriefingScenario): string[] {
  return scenario.playbook
    .toSorted((a, b) => a.order - b.order)
    .map((step) => {
      const parts = [`${step.order}단계`, step.action.toUpperCase()];
      if (step.ticker) parts.push(step.ticker);
      if (step.deltaPp != null) parts.push(`${step.deltaPp > 0 ? "+" : ""}${step.deltaPp}%p`);
      parts.push(step.currency);
      if (step.note) parts.push(`— ${step.note}`);
      return parts.join(" ");
    });
}

export function isFxOnlyPlaybook(scenario: BriefingScenario): boolean {
  const actions = scenario.playbook.map((p) => p.action);
  return actions.includes("fx") && !actions.includes("buy");
}
