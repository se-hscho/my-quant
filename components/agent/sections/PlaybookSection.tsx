"use client";

import type { Briefing, PlaybookStep } from "@/services/briefing/types";
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

  return (
    <ChartWithCaption
      title="Playbook — 환전·분할 매수·매도 순서"
      caption="과대 비중 조정 시 매도 → 환전 → 분할 매수 순으로 검토하세요."
      interpretation={[
        "각 단계의 %p·KRW 금액·분할 차수를 함께 봅니다.",
        "Follow는 균등 3분할, 선점은 50·30·20 선행 분할입니다.",
        "안 3은 환전·소량 매도만 수행하고 매수를 보류합니다.",
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
              안 {s.id} {s.label}
              {isFxOnlyPlaybook(s) ? " (환전·매도만)" : ""}
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
