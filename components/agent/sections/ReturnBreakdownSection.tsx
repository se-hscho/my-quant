"use client";

import type { Briefing } from "@/services/briefing/types";
import { formatScenarioReference } from "@/config/agent-scenarios";
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
      caption={`${formatScenarioReference(follow.id)} 합계 ${follow.expectedReturn}% = 자산 ${follow.assetReturn}% + FX ${follow.fxImpact}%p`}
      help={[
        "자산 수익은 보유·제안 비중 변화에서 기인합니다.",
        "환율 영향은 USD 보유·환전 타이밍에 민감합니다.",
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
