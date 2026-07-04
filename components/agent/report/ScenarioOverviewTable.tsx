"use client";

import type { Briefing } from "@/services/briefing/types";
import { formatScenarioHeading } from "@/config/agent-scenarios";

export function ScenarioOverviewTable({
  scenarios,
}: {
  scenarios: Briefing["scenarios"];
}) {
  const active = scenarios.filter((s) => s.id !== 0);

  return (
    <div className="overflow-x-auto rounded-md border" data-testid="scenario-overview">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50 text-left text-xs text-muted-foreground">
            <th className="px-3 py-2 font-medium">시나리오</th>
            <th className="px-3 py-2 font-medium text-right">예상 수익</th>
            <th className="px-3 py-2 font-medium text-right">변동성</th>
            <th className="px-3 py-2 font-medium text-right">자산</th>
            <th className="px-3 py-2 font-medium text-right">FX</th>
            <th className="px-3 py-2 font-medium">Playbook</th>
          </tr>
        </thead>
        <tbody>
          {scenarios.map((s) => (
            <tr key={s.id} className="border-b last:border-0">
              <td className="px-3 py-2 font-medium">
                {s.id === 0 ? "유지 (0안)" : formatScenarioHeading(s.id)}
              </td>
              <td className="px-3 py-2 text-right tabular-nums">{s.expectedReturn}%</td>
              <td className="px-3 py-2 text-right tabular-nums">{s.expectedVolatility}%</td>
              <td className="px-3 py-2 text-right tabular-nums">{s.assetReturn}%</td>
              <td className="px-3 py-2 text-right tabular-nums">{s.fxImpact}%p</td>
              <td className="px-3 py-2 text-muted-foreground">
                {s.playbook.length > 0 ? `${s.playbook.length}단계` : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="px-3 py-2 text-[11px] text-muted-foreground border-t">
        * KRW 환산 참고용 추정. {active.length}개 실행 시나리오 비교.
      </p>
    </div>
  );
}
