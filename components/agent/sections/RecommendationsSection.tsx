"use client";

import type { Briefing } from "@/services/briefing/types";
import { ChartWithCaption } from "../ChartWithCaption";

export function RecommendationsSection({
  rows,
}: {
  rows: Briefing["sections"]["recommendations"]["rows"];
}) {
  return (
    <ChartWithCaption
      title="미보유 섹터 추천 (검토용)"
      caption="확정 매수가 아닌 검토·고려 톤의 제안입니다."
      interpretation={[
        "유입 상위 섹터 중 보유하지 않은 영역의 대표 ETF를 제시합니다.",
        "본인 리스크 허용 범위와 통화별 현금을 함께 검토하세요.",
      ]}
    >
      <ul className="space-y-2 text-sm">
        {rows.map((r) => (
          <li key={`${r.sector}-${r.ticker}`} className="rounded-md border p-3">
            <strong>{r.label}</strong> — {r.ticker}
            <p className="mt-1 text-muted-foreground">{r.rationale}</p>
          </li>
        ))}
      </ul>
    </ChartWithCaption>
  );
}
