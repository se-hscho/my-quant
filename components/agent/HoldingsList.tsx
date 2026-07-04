"use client";

import type { HoldingsSnapshot } from "@/types/agent";
import {
  formatCashAmount,
  formatPnlKrw,
  formatPrice,
  formatQuantity,
  formatReturnPct,
} from "@/lib/agent/holdings-display";
import { formatTrendPct } from "@/lib/agent/price-trends";
import { formatKrw } from "@/lib/agent/valuation";
import { AGENT_SECTOR_LABELS, type AgentSectorId } from "@/config/agent";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PortfolioValueCard } from "./PortfolioValueCard";
import { usePortfolioValuation } from "@/hooks/usePortfolioValuation";
import { cn } from "@/lib/utils";

export interface HoldingsListProps {
  snapshot: HoldingsSnapshot;
}

function trendColor(pct: number | null | undefined): string {
  if (pct == null || !Number.isFinite(pct)) return "text-muted-foreground";
  if (pct > 0.5) return "text-emerald-600 dark:text-emerald-400";
  if (pct < -0.5) return "text-red-600 dark:text-red-400";
  return "text-muted-foreground";
}

function momentumBadgeClass(label: string | undefined): string {
  switch (label) {
    case "급등":
      return "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200";
    case "상승":
      return "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200";
    case "조정":
      return "bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-200";
    case "하락":
    case "급락":
      return "bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-200";
    default:
      return "bg-muted text-muted-foreground";
  }
}

export function HoldingsList({ snapshot }: HoldingsListProps) {
  const { valuation, loading, error, refresh } = usePortfolioValuation(snapshot);

  const valuationById = new Map(
    valuation?.holdings.map((h) => [h.id, h]) ?? []
  );

  return (
    <div className="space-y-4">
      <PortfolioValueCard
        valuation={valuation}
        loading={loading}
        error={error}
        onRefresh={() => void refresh()}
      />
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">통화별 현금</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-1">
          <p>KRW {formatCashAmount("KRW", snapshot.cash.krw)}</p>
          <p>USD {formatCashAmount("USD", snapshot.cash.usd)}</p>
          <p>JPY {formatCashAmount("JPY", snapshot.cash.jpy)}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">보유 종목 · 추세·비중</CardTitle>
          <p className="text-xs text-muted-foreground font-normal">
            수익금·수익률은 매수가 기준. 1일·7일·1개월은 Yahoo 종가 대비 변동률(참고용).
          </p>
        </CardHeader>
        <CardContent>
          {snapshot.holdings.length === 0 ? (
            <p className="text-sm text-muted-foreground">등록된 종목이 없습니다.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse min-w-[56rem]">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-2 pr-2 font-medium">티커</th>
                    <th className="py-2 pr-2 font-medium">비중</th>
                    <th className="py-2 pr-2 font-medium">평가</th>
                    <th className="py-2 pr-2 font-medium">수익금</th>
                    <th className="py-2 pr-2 font-medium">수익률</th>
                    <th className="py-2 pr-2 font-medium">1일</th>
                    <th className="py-2 pr-2 font-medium">7일</th>
                    <th className="py-2 pr-2 font-medium">1개월</th>
                    <th className="py-2 pr-2 font-medium">추세</th>
                    <th className="py-2 pr-2 font-medium">비중 힌트</th>
                    <th className="py-2 font-medium">매수가</th>
                  </tr>
                </thead>
                <tbody>
                  {snapshot.holdings.map((h) => {
                    const row = valuationById.get(h.id);
                    const returnPct = row?.returnPct;
                    const pnlKrw = row?.pnlKrw;
                    const trend = row?.priceTrend;
                    return (
                      <tr key={h.id} className="border-b last:border-0 align-top">
                        <td className="py-2 pr-2">
                          <div className="font-medium">{h.ticker}</div>
                          <div className="text-xs text-muted-foreground">
                            {formatQuantity(h.quantity)}
                            {h.sector
                              ? ` · ${AGENT_SECTOR_LABELS[h.sector as AgentSectorId] ?? h.sector}`
                              : ""}
                          </div>
                        </td>
                        <td className="py-2 pr-2 tabular-nums">
                          {loading
                            ? "…"
                            : row?.weightPct != null
                              ? `${row.weightPct.toFixed(1)}%`
                              : "—"}
                        </td>
                        <td className="py-2 pr-2 tabular-nums whitespace-nowrap">
                          {loading ? "…" : row ? formatKrw(row.valueKrw) : "—"}
                        </td>
                        <td
                          className={cn(
                            "py-2 pr-2 tabular-nums whitespace-nowrap",
                            pnlKrw == null
                              ? "text-muted-foreground"
                              : pnlKrw >= 0
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-red-600 dark:text-red-400"
                          )}
                        >
                          {loading
                            ? "…"
                            : pnlKrw != null
                              ? formatPnlKrw(pnlKrw)
                              : "—"}
                        </td>
                        <td
                          className={cn(
                            "py-2 pr-2 tabular-nums font-medium",
                            returnPct == null
                              ? "text-muted-foreground"
                              : returnPct >= 0
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-red-600 dark:text-red-400"
                          )}
                        >
                          {loading
                            ? "…"
                            : returnPct != null
                              ? formatReturnPct(returnPct)
                              : "매수가 필요"}
                        </td>
                        <td className={cn("py-2 pr-2 tabular-nums", trendColor(trend?.d1))}>
                          {loading ? "…" : formatTrendPct(trend?.d1)}
                        </td>
                        <td className={cn("py-2 pr-2 tabular-nums", trendColor(trend?.d7))}>
                          {loading ? "…" : formatTrendPct(trend?.d7)}
                        </td>
                        <td className={cn("py-2 pr-2 tabular-nums", trendColor(trend?.m1))}>
                          {loading ? "…" : formatTrendPct(trend?.m1)}
                        </td>
                        <td className="py-2 pr-2">
                          {loading ? (
                            "…"
                          ) : row?.momentum ? (
                            <Badge
                              variant="secondary"
                              className={cn(
                                "text-[10px] font-normal",
                                momentumBadgeClass(row.momentum.labelKo)
                              )}
                            >
                              {row.momentum.labelKo}
                            </Badge>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="py-2 pr-2 max-w-[10rem] text-xs text-muted-foreground">
                          {loading ? "…" : (row?.weightHint ?? "—")}
                        </td>
                        <td className="py-2 tabular-nums whitespace-nowrap">
                          {h.avgCost != null && h.avgCost > 0
                            ? formatPrice(h.currency, h.avgCost)
                            : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
