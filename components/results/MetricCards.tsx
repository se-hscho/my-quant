"use client";

import type { PortfolioMetrics } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { InfoTooltip } from "@/components/common/InfoTooltip";

const FORMATTERS = {
  pct: (v: number) => `${(v * 100).toFixed(2)}%`,
  num: (v: number) => v.toFixed(2),
};

const ITEMS: {
  key: keyof PortfolioMetrics;
  label: string;
  description: string;
  format: (v: number) => string;
}[] = [
  {
    key: "annualReturn",
    label: "연환산 수익률",
    description: "한 해 동안 기대되는 수익률을 연 단위로 환산한 값.",
    format: FORMATTERS.pct,
  },
  {
    key: "volatility",
    label: "변동성",
    description: "수익률이 평균에서 얼마나 흔들리는지 — 위험의 크기.",
    format: FORMATTERS.pct,
  },
  {
    key: "sharpe",
    label: "샤프비율",
    description: "위험 1단위당 얼마의 수익을 얻었는지. 클수록 좋다.",
    format: FORMATTERS.num,
  },
  {
    key: "mdd",
    label: "MDD",
    description: "고점 대비 최대 낙폭. 0에 가까울수록 안전.",
    format: FORMATTERS.pct,
  },
];

export function MetricCards({ metrics }: { metrics: PortfolioMetrics }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {ITEMS.map((item) => (
        <Card key={item.key} size="sm" data-testid={`metric-${item.key}`}>
          <CardContent className="flex flex-col gap-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <span>{item.label}</span>
              <InfoTooltip label={item.label} description={item.description} />
            </div>
            <div className="text-xl font-semibold tabular-nums">
              {item.format(metrics[item.key])}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
