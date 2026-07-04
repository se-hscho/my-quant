"use client";

import type { Briefing } from "@/services/briefing/types";
import { recommendationActionLabel } from "@/services/briefing/recommendations";
import { formatScenarioReference } from "@/config/agent-scenarios";
import { ChartWithCaption } from "../ChartWithCaption";

export function RecommendationsSection({
  rows,
}: {
  rows: Briefing["sections"]["recommendations"]["rows"];
}) {
  const inflowCount = rows.filter((r) => r.action === "buy" || r.action === "new_sector").length;
  const caption =
    rows.length === 0
      ? "당일 L3·L4 신호 없음"
      : `L3·L4 신호 ${rows.length}건 — 매수·신규 ${inflowCount}건, 축소·관찰 ${rows.length - inflowCount}건`;

  return (
    <ChartWithCaption
      title="분석 기반 검토안"
      caption={caption}
      help={[
        "L3=섹터 자금 흐름, L4=보유 종목 기준입니다.",
        "분할 가이드는 playbook과 동일한 차수를 따릅니다.",
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
                  <span className="text-xs text-muted-foreground">
                    {formatScenarioReference(r.scenarioId)}
                  </span>
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
                {r.returnPct != null ? (
                  <span>
                    수익률 {r.returnPct >= 0 ? "+" : ""}
                    {r.returnPct.toFixed(1)}%
                  </span>
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
