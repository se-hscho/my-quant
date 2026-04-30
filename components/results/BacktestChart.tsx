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
import { fetchPrices } from "@/lib/yahoo-finance";
import { calcBacktest, type BacktestRange, type BacktestSeries } from "@/lib/backtesting";

const RANGES: BacktestRange[] = ["1y", "3y", "5y", "10y"];

export interface BacktestChartProps {
  tickers: string[];
  weights: Record<string, number>;
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
        <div className="h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 16, right: 16, left: 8, bottom: 16 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={false} />
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
                stroke="hsl(220 80% 55%)"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="Buy & Hold"
                stroke="hsl(0 70% 55%)"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
