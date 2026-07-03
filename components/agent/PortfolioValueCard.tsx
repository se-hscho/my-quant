"use client";

import type { ValuationResult } from "@/lib/agent/valuation";
import { formatKrw } from "@/lib/agent/valuation";
import { formatCashAmount, TOTAL_ASSETS_PLACEHOLDER } from "@/lib/agent/holdings-display";
import { Button } from "@/components/ui/button";
import { RefreshCwIcon } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export interface PortfolioValueCardProps {
  valuation: ValuationResult | null;
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
}

export function PortfolioValueCard({
  valuation,
  loading,
  error,
  onRefresh,
}: PortfolioValueCardProps) {
  return (
    <Card data-testid="portfolio-value-card">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base">총자산 (KRW 환산)</CardTitle>
          {onRefresh ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="시세 새로고침"
              disabled={loading}
              onClick={onRefresh}
            >
              <RefreshCwIcon className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
            </Button>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        {loading ? (
          <p className="text-muted-foreground">{TOTAL_ASSETS_PLACEHOLDER}</p>
        ) : error ? (
          <p className="text-destructive">{error}</p>
        ) : valuation ? (
          <>
            <p className="text-2xl font-semibold tabular-nums">
              {formatKrw(valuation.totalKrw)}
            </p>
            <p className="text-muted-foreground">
              현금 환산 {formatKrw(valuation.cashKrw)} · 종목{" "}
              {formatKrw(valuation.holdingsKrw)}
            </p>
            <p className="text-xs text-muted-foreground">
              환율 USD/KRW {valuation.fx.usdKrw.toLocaleString("ko-KR")} · JPY/KRW{" "}
              {valuation.fx.jpyKrw.toLocaleString("ko-KR")}
            </p>
            {valuation.warnings.length > 0 ? (
              <p className="text-xs text-amber-700 dark:text-amber-400">
                {valuation.warnings.join(" · ")}
              </p>
            ) : null}
          </>
        ) : (
          <p className="text-muted-foreground">보유를 등록하면 표시됩니다.</p>
        )}
      </CardContent>
    </Card>
  );
}

export function PortfolioCashRow({
  krw,
  usd,
  jpy,
}: {
  krw: number;
  usd: number;
  jpy: number;
}) {
  return (
    <p className="text-sm text-muted-foreground">
      현금 {formatCashAmount("KRW", krw)} · {formatCashAmount("USD", usd)} ·{" "}
      {formatCashAmount("JPY", jpy)}
    </p>
  );
}
