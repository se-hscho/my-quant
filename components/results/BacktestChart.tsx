"use client";

import * as React from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { InfoTooltip } from "@/components/common/InfoTooltip";
import { fetchPrices } from "@/lib/yahoo-finance";
import { calcBacktest, type BacktestRange, type BacktestSeries } from "@/lib/backtesting";

const RANGES: BacktestRange[] = ["1y", "3y", "5y", "10y"];

export interface BacktestChartProps {
  tickers: string[];
  weights: Record<string, number>;
}

interface BacktestSummary {
  optFinal: number;
  bhFinal: number;
  diff: number;
  outperformRate: number;
}

function calcSummary(series: BacktestSeries): BacktestSummary {
  const last = series.dates.length - 1;
  const optFinal = series.optimalReturns[last] ?? 0;
  const bhFinal = series.buyHoldReturns[last] ?? 0;
  const diff = optFinal - bhFinal;
  const outperformDays = series.optimalReturns.filter(
    (r, i) => r > series.buyHoldReturns[i]
  ).length;
  const outperformRate = series.dates.length > 0 ? outperformDays / series.dates.length : 0;
  return { optFinal, bhFinal, diff, outperformRate };
}

function verdict(diff: number, outperformRate: number): { label: string; color: string } {
  if (diff >= 0.1 && outperformRate >= 0.55) return { label: "유의미한 초과수익", color: "text-emerald-600 dark:text-emerald-400" };
  if (diff >= 0.03) return { label: "소폭 초과수익", color: "text-emerald-600 dark:text-emerald-400" };
  if (diff <= -0.03) return { label: "B&H 우위", color: "text-red-500" };
  return { label: "유사한 성과", color: "text-muted-foreground" };
}

function pct(v: number, decimals = 1) {
  return `${v >= 0 ? "+" : ""}${(v * 100).toFixed(decimals)}%`;
}

export function BacktestChart({ tickers, weights }: BacktestChartProps) {
  const [range, setRange] = React.useState<BacktestRange>("3y");
  const [series, setSeries] = React.useState<BacktestSeries | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const all = await Promise.all(tickers.map((t) => fetchPrices(t, "10y")));
        if (cancelled) return;
        const minLen = Math.min(...all.map((s) => s.closes.length));
        const aligned: Record<string, number[]> = {};
        for (let i = 0; i < tickers.length; i++) {
          aligned[tickers[i]] = all[i].closes.slice(all[i].closes.length - minLen);
        }
        const dates = all[0].dates.slice(all[0].dates.length - minLen);
        setSeries(calcBacktest({ pricesByTicker: aligned, dates, weights, range }));
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tickers, weights, range]);

  const chartData = React.useMemo(() => {
    if (!series) return [];
    return series.dates.map((d, i) => ({
      date: d,
      "최적 포트폴리오": series.optimalReturns[i] * 100,
      "Buy & Hold": series.buyHoldReturns[i] * 100,
    }));
  }, [series]);

  const summary = React.useMemo(
    () => (series && series.dates.length > 0 ? calcSummary(series) : null),
    [series]
  );

  return (
    <div className="flex flex-col gap-3">
      <div role="group" aria-label="백테스트 기간" className="flex gap-2">
        {RANGES.map((r) => (
          <Button
            key={r}
            size="sm"
            variant={range === r ? "default" : "outline"}
            onClick={() => setRange(r)}
          >
            {r === "1y" ? "1년" : r === "3y" ? "3년" : r === "5y" ? "5년" : "10년"}
          </Button>
        ))}
      </div>

      {error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : loading ? (
        <p className="text-sm text-muted-foreground">백테스트 계산 중...</p>
      ) : (
        <>
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 16, right: 16, left: 8, bottom: 24 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  interval={Math.floor(Math.max(chartData.length - 1, 1) / 5)}
                  tickFormatter={(d: string) => d.slice(0, 7).replace("-", ".")}
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                />
                <YAxis tickFormatter={(v) => `${v.toFixed(0)}%`} />
                <RechartsTooltip
                  formatter={(v) =>
                    typeof v === "number" ? `${v.toFixed(2)}%` : String(v)
                  }
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="최적 포트폴리오"
                  stroke="hsl(220, 80%, 55%)"
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="Buy & Hold"
                  stroke="hsl(0, 70%, 55%)"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {summary && (() => {
            const { label, color } = verdict(summary.diff, summary.outperformRate);
            return (
              <div className="rounded-lg border bg-muted/30 px-4 py-3">
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">기간 결과 요약</span>
                  <span className={`text-xs font-semibold ${color}`}>{label}</span>
                </div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-4">
                  <div className="flex flex-col gap-0.5">
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      최적 포트폴리오
                      <InfoTooltip label="최적 포트폴리오" description="최적화된 비중을 기간 내내 고정하여 보유했을 때의 누적 수익률입니다." />
                    </span>
                    <span className={`font-semibold tabular-nums ${summary.optFinal >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"}`}>
                      {pct(summary.optFinal)}
                    </span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      Buy &amp; Hold
                      <InfoTooltip label="Buy & Hold" description="모든 종목을 균등 비중(1/N)으로 매수해 리밸런싱 없이 그대로 보유한 누적 수익률입니다. 최적화 효과를 비교하는 기준선입니다." />
                    </span>
                    <span className={`font-semibold tabular-nums ${summary.bhFinal >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"}`}>
                      {pct(summary.bhFinal)}
                    </span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      초과수익
                      <InfoTooltip label="초과수익 (Alpha)" description="최적 포트폴리오 최종 수익률 − Buy & Hold 최종 수익률입니다. 양수(+)이면 최적화가 단순 보유보다 더 나은 성과를 냈다는 뜻입니다." />
                    </span>
                    <span className={`font-semibold tabular-nums ${summary.diff >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"}`}>
                      {pct(summary.diff)}
                    </span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      아웃퍼폼 비율
                      <InfoTooltip label="아웃퍼폼 비율" description="전체 거래일 중 최적 포트폴리오의 누적수익이 Buy & Hold보다 높았던 날의 비율입니다. 50% 초과이면 기간 대부분에서 최적화가 우위였다는 의미입니다." />
                    </span>
                    <span className={`font-semibold tabular-nums ${summary.outperformRate >= 0.5 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"}`}>
                      {(summary.outperformRate * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>
            );
          })()}
        </>
      )}
    </div>
  );
}
