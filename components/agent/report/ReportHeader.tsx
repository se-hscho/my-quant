"use client";

import Link from "next/link";
import type { Briefing } from "@/services/briefing/types";
import { formatKrw } from "@/lib/agent/valuation";
import { Badge } from "@/components/ui/badge";

function formatReportDate(isoDate: string): string {
  const d = new Date(`${isoDate}T12:00:00`);
  const weekday = d.toLocaleDateString("ko-KR", { weekday: "short" });
  return `${isoDate} (${weekday})`;
}

export function ReportHeader({ briefing }: { briefing: Briefing }) {
  const deploymentMode = briefing.sections.investmentDirection?.mode === "deployment";

  return (
    <header
      className="rounded-lg border bg-card p-5 shadow-sm"
      data-testid="report-header"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Daily Portfolio Research
          </p>
          <h2 className="text-xl font-semibold tracking-tight">데일리 포트폴리오 리서치</h2>
          <p className="text-sm text-muted-foreground">
            {formatReportDate(briefing.date)} · {formatKrw(briefing.totalAssetsKrw)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">
            {deploymentMode ? "신규 배분" : "리밸런싱"}
          </Badge>
          <Badge variant="outline">참고용 · Non-Advice</Badge>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t pt-3 text-sm">
        <span className="text-muted-foreground">
          개인 포트폴리오 맞춤 · L0~L4 계층 분석 · 시나리오·Playbook
        </span>
        <Link href="/agent" className="text-primary hover:underline shrink-0">
          ← 요약으로
        </Link>
      </div>
    </header>
  );
}
