"use client";

import type { Briefing } from "@/services/briefing/types";
import { formatScenarioHeading, formatScenarioReference } from "@/config/agent-scenarios";
import { ChartWithCaption } from "../ChartWithCaption";
import { InfoTooltip } from "@/components/common/InfoTooltip";

function weightDelta(before: number, after: number): string {
  const d = Math.round((after - before) * 10) / 10;
  if (d === 0) return "—";
  return `${d > 0 ? "+" : ""}${d}%p`;
}

export function ScenariosSection({
  scenarios,
}: {
  scenarios: Briefing["scenarios"];
}) {
  const active = scenarios.filter((s) => s.id !== 0);
  const topReturn = active.toSorted((a, b) => b.expectedReturn - a.expectedReturn)[0];

  return (
    <ChartWithCaption
      title="시나리오 Before/After"
      caption={
        topReturn
          ? `예상 수익률 최고 ${formatScenarioReference(topReturn.id)} ${topReturn.expectedReturn}% (σ ${topReturn.expectedVolatility}%, 참고용)`
          : "시나리오별 비중·수익률 비교 (참고용)"
      }
      help={[
        "Before=현재 시장가치 비중, After=리밸런싱 제안 후 비중입니다.",
        "CASH는 KRW·USD·JPY 현금 합산 비중입니다.",
        "Follow·선점·최소변경은 기관 수급을 개인 규모로 번역한 시나리오입니다.",
      ]}
    >
      <div className="space-y-4">
        {scenarios.map((s) => {
          const keys = [
            ...new Set([
              ...Object.keys(s.weightsBefore),
              ...Object.keys(s.weightsAfter),
            ]),
          ].toSorted((a, b) => {
            if (a === "CASH") return 1;
            if (b === "CASH") return -1;
            return (s.weightsAfter[b] ?? 0) - (s.weightsAfter[a] ?? 0);
          });

          return (
            <div key={s.id} className="rounded-md border p-3 text-sm">
              <div className="flex items-center gap-2 font-medium">
                {formatScenarioHeading(s.id)}
                <InfoTooltip
                  label={formatScenarioHeading(s.id)}
                  description={`예상 수익 ${s.expectedReturn}% · 변동성 ${s.expectedVolatility}% (참고용)`}
                />
              </div>
              <p className="text-muted-foreground">
                수익 {s.expectedReturn}% (자산 {s.assetReturn}% + FX {s.fxImpact}%p) · σ{" "}
                {s.expectedVolatility}%
              </p>
              <table className="mt-2 w-full text-xs">
                <thead>
                  <tr className="text-muted-foreground">
                    <th className="text-left py-1">자산</th>
                    <th className="text-right">Before</th>
                    <th className="text-right">After</th>
                    <th className="text-right">Δ</th>
                  </tr>
                </thead>
                <tbody>
                  {keys.map((t) => {
                    const before = s.weightsBefore[t] ?? 0;
                    const after = s.weightsAfter[t] ?? 0;
                    return (
                      <tr key={t}>
                        <td className="py-1">{t === "CASH" ? "현금(CASH)" : t}</td>
                        <td className="text-right">{before}%</td>
                        <td className="text-right">{after}%</td>
                        <td className="text-right text-muted-foreground">
                          {weightDelta(before, after)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
        })}
      </div>
    </ChartWithCaption>
  );
}
