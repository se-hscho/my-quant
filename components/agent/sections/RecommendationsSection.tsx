"use client";

import type { Briefing } from "@/services/briefing/types";
import { recommendationActionLabel } from "@/services/briefing/recommendations";
import { ChartWithCaption } from "../ChartWithCaption";

export function RecommendationsSection({
  rows,
}: {
  rows: Briefing["sections"]["recommendations"]["rows"];
}) {
  return (
    <ChartWithCaption
      title="분석 가이드 기반 추천 (검토용)"
      caption="L3(섹터)·L4(종목) 신호와 playbook 분할 실행을 연결한 제안입니다."
      interpretation={[
        "신규 섹터는 L3 유입 + L4 미보유, 비중 확대·축소는 L4 보유 종목 기준입니다.",
        "분할 가이드는 Follow(안 1)·선점(안 2)·최소변경(안 3) playbook과 동일한 차수를 따릅니다.",
        "확정 매수가 아닌 검토·고려 톤입니다.",
      ]}
    >
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">당일 추천 신호가 없습니다.</p>
      ) : (
        <ul className="space-y-3 text-sm">
          {rows.map((r) => (
            <li key={r.id} className="rounded-md border p-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded bg-muted px-1.5 py-0.5 text-xs font-medium">
                  {r.layer}
                </span>
                <span className="rounded border px-1.5 py-0.5 text-xs">
                  {recommendationActionLabel(r.action)}
                </span>
                {r.scenarioId != null ? (
                  <span className="text-xs text-muted-foreground">안 {r.scenarioId}</span>
                ) : null}
              </div>
              <p className="mt-2 font-medium">
                {r.label} — {r.ticker}
                {r.targetDeltaPp != null ? (
                  <span className="font-normal text-muted-foreground">
                    {" "}
                    ({r.targetDeltaPp > 0 ? "+" : ""}
                    {r.targetDeltaPp}%p)
                  </span>
                ) : null}
              </p>
              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                {r.currentWeightPct != null ? (
                  <span>현재 {r.currentWeightPct}%</span>
                ) : null}
                {r.amountKrw != null ? (
                  <span>참고 {r.amountKrw.toLocaleString("ko-KR")}원</span>
                ) : null}
                {r.splitGuide ? <span>{r.splitGuide}</span> : null}
              </div>
              <ul className="mt-2 list-disc pl-5 text-xs text-muted-foreground space-y-0.5">
                {r.signals.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
              <p className="mt-2 text-muted-foreground">{r.rationale}</p>
            </li>
          ))}
        </ul>
      )}
    </ChartWithCaption>
  );
}
