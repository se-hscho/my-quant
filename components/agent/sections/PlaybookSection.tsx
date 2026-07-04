"use client";

import type { Briefing } from "@/services/briefing/types";
import { ChartWithCaption } from "../ChartWithCaption";
import { isFxOnlyPlaybook } from "@/services/briefing/playbook";

export function PlaybookSection({
  scenarios,
}: {
  scenarios: Briefing["scenarios"];
}) {
  const active = scenarios.filter((s) => s.id !== 0);

  return (
    <ChartWithCaption
      title="Playbook — 환전·매수·매도 순서"
      caption="USD 부족 시 환전(0단계)이 매수보다 앞서는지 확인하세요."
      interpretation={[
        "각 단계의 %p 변화와 사용 통화를 함께 봅니다.",
        "안 3은 환전만 수행하고 매수를 보류하는 구성으로 다른 안과 구분됩니다.",
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
              {isFxOnlyPlaybook(s) ? " (환전만)" : ""}
            </p>
            <ol className="mt-2 list-decimal pl-5 space-y-1">
              {s.playbook
                .toSorted((a, b) => a.order - b.order)
                .map((step) => (
                  <li key={`${s.id}-${step.order}`}>
                    {step.action.toUpperCase()}{" "}
                    {step.ticker ? `${step.ticker} ` : ""}
                    {step.deltaPp != null ? `${step.deltaPp}%p ` : ""}
                    {step.currency} — {step.note}
                  </li>
                ))}
            </ol>
          </div>
        ))}
      </div>
    </ChartWithCaption>
  );
}
