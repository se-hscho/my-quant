"use client";

import type { Briefing } from "@/services/briefing/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function LlmNarrativeSection({
  narrative,
}: {
  narrative: NonNullable<Briefing["sections"]["llmNarrative"]>;
}) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">AI 포트폴리오 분석</CardTitle>
          <p className="text-xs font-normal text-muted-foreground">
            Gemini 기반 맥락 분석 ({narrative.model}). 참고용·투자 권유 아님.
          </p>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <ul className="list-disc space-y-1 pl-5">
            {narrative.executiveLines.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          <div>
            <p className="font-medium text-xs text-muted-foreground">자산군</p>
            <p className="whitespace-pre-wrap">{narrative.assetClassAnalysis}</p>
          </div>
          <div>
            <p className="font-medium text-xs text-muted-foreground">세부 섹터</p>
            <p className="whitespace-pre-wrap">{narrative.subSectorAnalysis}</p>
          </div>
        </CardContent>
      </Card>

      {narrative.holdings.length > 0 ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">종목별 맥락 분석</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {narrative.holdings.map((h) => (
              <article key={h.ticker} className="border-b pb-3 last:border-0 last:pb-0">
                <h4 className="font-semibold">{h.ticker}</h4>
                <dl className="mt-1 grid gap-1 text-sm">
                  <div>
                    <dt className="text-xs text-muted-foreground">시장·섹터</dt>
                    <dd>{h.marketContext || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">가격 추세</dt>
                    <dd>{h.trendRead || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">비중·대응</dt>
                    <dd>{h.weightAction || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">전망</dt>
                    <dd>{h.outlook || "—"}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
