"use client";

import type { Briefing } from "@/services/briefing/types";
import { ChartWithCaption } from "../ChartWithCaption";
import { InfoTooltip } from "@/components/common/InfoTooltip";

export function ScenariosSection({
  scenarios,
}: {
  scenarios: Briefing["scenarios"];
}) {
  return (
    <ChartWithCaption
      title="시나리오 Before/After"
      caption="안 0~3 예상 수익률·비중 비교 (참고용·보장 아님)"
      interpretation={[
        "Before는 현재 추정 비중, After는 제안 후 비중입니다.",
        "Follow·선점·최소변경은 기관 방향을 개인 규모로 번역한 시나리오입니다.",
      ]}
    >
      <div className="space-y-4">
        {scenarios.map((s) => (
          <div key={s.id} className="rounded-md border p-3 text-sm">
            <div className="flex items-center gap-2 font-medium">
              안 {s.id} {s.label}
              <InfoTooltip
                label={s.label}
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
                  <th className="text-left py-1">티커</th>
                  <th className="text-right">Before</th>
                  <th className="text-right">After</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(s.weightsAfter).map((t) => (
                  <tr key={t}>
                    <td className="py-1">{t}</td>
                    <td className="text-right">{s.weightsBefore[t] ?? 0}%</td>
                    <td className="text-right">{s.weightsAfter[t] ?? 0}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </ChartWithCaption>
  );
}
