"use client";

import type { Briefing, PlaybookStep } from "@/services/briefing/types";
import { formatScenarioHeading, SCENARIO_DISPLAY } from "@/config/agent-scenarios";
import { ChartWithCaption } from "../ChartWithCaption";
import { isFxOnlyPlaybook } from "@/services/briefing/playbook";

function formatStepAmount(step: PlaybookStep): string {
  if (step.amountKrw == null) return "";
  return ` · ${step.amountKrw.toLocaleString("ko-KR")}원`;
}

function formatTranche(step: PlaybookStep): string {
  if (step.tranche != null && step.trancheTotal != null && step.trancheTotal > 1) {
    return ` [${step.tranche}/${step.trancheTotal}차]`;
  }
  return "";
}

export function PlaybookSection({
  scenarios,
}: {
  scenarios: Briefing["scenarios"];
}) {
  const active = scenarios.filter((s) => s.id !== 0);
  const stepCount = active.reduce((n, s) => n + s.playbook.length, 0);

  return (
    <ChartWithCaption
      title="Playbook — 실행 순서"
      caption={`${active.length}개 시나리오 · 총 ${stepCount}단계 (환전→매도→분할 매수)`}
      help={[
        "각 단계의 %p·KRW 금액·분할 차수를 함께 봅니다.",
        `Follow=${SCENARIO_DISPLAY[1].splitStyle}, 선점=${SCENARIO_DISPLAY[2].splitStyle}.`,
        "최소변경 (3안)은 환전·소량 매도 위주입니다.",
      ]}
    >
      <div className="space-y-3">
        {active.map((s) => (
          <div
            key={s.id}
            className={
              isFxOnlyPlaybook(s)
                ? "rounded-md border border-dashed p-3 text-sm"
                : "rounded-md border p-3 text-sm"
            }
          >
            <p className="font-medium">
              {formatScenarioHeading(s.id)}
              {isFxOnlyPlaybook(s) ? " — 환전·매도만" : ""}
            </p>
            <ol className="mt-2 list-decimal pl-5 space-y-1">
              {s.playbook
                .toSorted((a, b) => a.order - b.order)
                .map((step) => (
                  <li key={`${s.id}-${step.order}`}>
                    <span className="font-medium">{step.action.toUpperCase()}</span>
                    {step.ticker ? ` ${step.ticker}` : ""}
                    {step.deltaPp != null ? ` ${step.deltaPp > 0 ? "+" : ""}${step.deltaPp}%p` : ""}
                    {formatTranche(step)}
                    {formatStepAmount(step)}
                    {` (${step.currency})`}
                    {step.note ? ` — ${step.note}` : ""}
                  </li>
                ))}
            </ol>
          </div>
        ))}
      </div>
    </ChartWithCaption>
  );
}
