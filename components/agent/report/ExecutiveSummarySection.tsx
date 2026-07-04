"use client";

import type { ReportExecutiveSummary } from "@/lib/agent/report-outline";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ExecutiveSummarySection({ summary }: { summary: ReportExecutiveSummary }) {
  return (
    <div className="space-y-4" data-testid="executive-summary">
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Investment Thesis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-base font-medium leading-relaxed">{summary.thesis}</p>
          {summary.recommendedScenario ? (
            <p className="mt-2 text-sm text-muted-foreground">
              기준 시나리오: {summary.recommendedScenario}
            </p>
          ) : null}
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {summary.keyMetrics.map((m) => (
          <Card key={m.label} className="py-3">
            <CardContent className="px-4 py-0">
              <p className="text-xs text-muted-foreground">{m.label}</p>
              <p className="text-lg font-semibold tabular-nums">{m.value}</p>
              {m.note ? <p className="text-[11px] text-muted-foreground">{m.note}</p> : null}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <h4 className="text-sm font-semibold mb-2">Key Conclusions</h4>
          <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed">
            {summary.conclusions.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>

        {summary.actionItems.length > 0 ? (
          <div>
            <h4 className="text-sm font-semibold mb-2">Priority Actions</h4>
            <ol className="space-y-2 text-sm">
              {summary.actionItems.map((item) => (
                <li key={item.priority} className="flex gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                    {item.priority}
                  </span>
                  <span className="leading-relaxed">{item.text}</span>
                </li>
              ))}
            </ol>
          </div>
        ) : null}
      </div>
    </div>
  );
}
