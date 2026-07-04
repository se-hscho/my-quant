"use client";

import type { AnalystRow } from "@/services/briefing/types";
import { getAnalystFallbackRationale } from "@/services/analyst/fallback-rationale";
import { ChartWithCaption } from "../ChartWithCaption";

export function AnalystSection({
  reports,
  missingTickers,
}: {
  reports: AnalystRow[];
  missingTickers: string[];
}) {
  return (
    <ChartWithCaption
      title="증권사 애널 리포트 (공개 요약)"
      caption="출처·날짜가 있는 항목만 표시합니다."
      interpretation={[
        "다수 의견이 Follow 안과 정합하는지 스스로 판단하세요.",
        "목표가·투자의견은 참고용이며 투자 권유가 아닙니다.",
      ]}
    >
      {reports.length > 0 ? (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-muted-foreground text-left">
              <th className="py-2">티커</th>
              <th className="py-2">증권사</th>
              <th className="py-2">의견</th>
              <th className="py-2">요약</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((r) => (
              <tr key={`${r.ticker}-${r.broker}-${r.date}`} className="border-b">
                <td className="py-2">{r.ticker}</td>
                <td className="py-2">
                  {r.broker} ({r.date})
                </td>
                <td className="py-2">{r.rating}</td>
                <td className="py-2">
                  {r.summary}
                  {r.sourceUrl ? (
                    <>
                      {" "}
                      <a href={r.sourceUrl} className="underline" target="_blank" rel="noreferrer">
                        원문
                      </a>
                    </>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
      {missingTickers.map((t) => (
        <p key={t} className="text-sm text-muted-foreground">
          {t}: 데이터 없음 — {getAnalystFallbackRationale(t)}
        </p>
      ))}
    </ChartWithCaption>
  );
}
