"use client";

import Link from "next/link";
import type { Briefing } from "@/services/briefing/types";
import { formatKrw } from "@/lib/agent/valuation";
import { formatCashAmount } from "@/lib/agent/holdings-display";
import { PortfolioValueCard } from "./PortfolioValueCard";
import { ScenarioCompareChart } from "./ScenarioCompareChart";
import { SectorTop3Chart } from "./SectorTop3Chart";
import { usePortfolioValuation } from "@/hooks/usePortfolioValuation";
import type { HoldingsSnapshot } from "@/types/agent";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function SummaryPage({
  briefing,
  snapshot,
  isDemo = false,
  reportHref,
}: {
  briefing: Briefing;
  snapshot: HoldingsSnapshot;
  isDemo?: boolean;
  reportHref?: string;
}) {
  const { valuation, loading, error, refresh } = usePortfolioValuation(snapshot);
  const detailHref = reportHref ?? `/agent/report/${briefing.date}`;

  return (
    <div className="space-y-4" data-testid="summary-page">
      {isDemo ? (
        <p className="text-xs text-amber-700 dark:text-amber-400">
          아래 수치는 예시 포트폴리오 기준이며, Yahoo 시세·환율로 계산됩니다.
        </p>
      ) : null}
      <PortfolioValueCard
        valuation={valuation}
        loading={loading}
        error={error}
        onRefresh={() => void refresh()}
      />
      <p className="text-sm text-muted-foreground">
        현금 {formatCashAmount("KRW", briefing.cash.krw)} ·{" "}
        {formatCashAmount("USD", briefing.cash.usd)} ·{" "}
        {formatCashAmount("JPY", briefing.cash.jpy)}
      </p>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">오늘 결론</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc space-y-1 pl-4 text-sm">
            {briefing.summaryLines.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <SectorTop3Chart sectors={briefing.sectorTop3} />
      <ScenarioCompareChart scenarios={briefing.scenarioComparison} />

      <Card>
        <CardContent className="py-3 text-sm">
          <p>{briefing.fxRebalanceLine}</p>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Button variant="default" size="sm" asChild>
          <Link href={detailHref}>상세 레포트 보기</Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href="/agent/holdings">보유 편집</Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href="/agent/history">브리핑 히스토리</Link>
        </Button>
      </div>

      <p className="text-[10px] text-muted-foreground text-center">
        {briefing.disclaimer}
      </p>
      <p className="text-xs text-muted-foreground text-center">
        총자산 브리핑 기준: {formatKrw(briefing.totalAssetsKrw)}
      </p>
    </div>
  );
}
