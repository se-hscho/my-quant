"use client";

import type { Briefing } from "@/services/briefing/types";
import { ChartWithCaption } from "../ChartWithCaption";

export function ReturnBreakdownSection({
  scenarios,
}: {
  scenarios: Briefing["scenarios"];
}) {
  const follow = scenarios.find((s) => s.id === 1) ?? scenarios[0];

  return (
    <ChartWithCaption
      title="예상 수익률 — 자산 vs 환율"
      caption={`안 ${follow.id} 기준 KRW 환산 (참고용)`}
      interpretation={[
        `자산 수익 기여: 약 ${follow.assetReturn}%p.`,
        `환율 영향: 약 ${follow.fxImpact}%p — USD 보유·환전 타이밍에 민감합니다.`,
      ]}
    >
      <table className="w-full text-sm">
        <tbody>
          <tr className="border-b">
            <td className="py-2">자산 수익 (KRW)</td>
            <td className="py-2 text-right">{follow.assetReturn}%</td>
          </tr>
          <tr className="border-b">
            <td className="py-2">환율 영향</td>
            <td className="py-2 text-right">{follow.fxImpact}%p</td>
          </tr>
          <tr>
            <td className="py-2 font-medium">합계 (참고용)</td>
            <td className="py-2 text-right font-medium">{follow.expectedReturn}%</td>
          </tr>
        </tbody>
      </table>
    </ChartWithCaption>
  );
}
