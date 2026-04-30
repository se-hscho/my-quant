"use client";

import { WeightPieChart } from "@/components/results/WeightPieChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { PortfolioResult } from "@/types";

const METHOD_LABEL: Record<string, string> = {
  "max-sharpe": "Max Sharpe",
  "min-variance": "Min Variance",
  "risk-parity": "Risk Parity",
};

function pct(v: number) {
  return `${(v * 100).toFixed(2)}%`;
}

function MetricRow({ label, a, b }: { label: string; a: string; b: string }) {
  return (
    <div className="grid grid-cols-3 items-center gap-2 border-b py-2 text-sm last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-mono">{a}</span>
      <span className="text-right font-mono">{b}</span>
    </div>
  );
}

function ResultColumn({ result }: { result: PortfolioResult }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          {result.bundleName}
          <Badge variant="secondary">
            {METHOD_LABEL[result.method] ?? result.method}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <WeightPieChart weights={result.weights} />
      </CardContent>
    </Card>
  );
}

export interface CompareViewProps {
  a: PortfolioResult | null;
  b: PortfolioResult | null;
}

export function CompareView({ a, b }: CompareViewProps) {
  if (!a || !b) {
    return (
      <p className="text-sm text-muted-foreground" data-testid="compare-missing">
        비교할 결과를 찾을 수 없습니다. 기록 페이지에서 두 결과를 선택해 주세요.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">핵심 지표</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2 border-b pb-2 text-xs font-semibold">
            <span></span>
            <span className="text-right">{a.bundleName}</span>
            <span className="text-right">{b.bundleName}</span>
          </div>
          <MetricRow
            label="연환산 수익률"
            a={pct(a.metrics.annualReturn)}
            b={pct(b.metrics.annualReturn)}
          />
          <MetricRow
            label="변동성"
            a={pct(a.metrics.volatility)}
            b={pct(b.metrics.volatility)}
          />
          <MetricRow
            label="샤프비율"
            a={a.metrics.sharpe.toFixed(2)}
            b={b.metrics.sharpe.toFixed(2)}
          />
          <MetricRow
            label="MDD"
            a={pct(a.metrics.mdd)}
            b={pct(b.metrics.mdd)}
          />
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <ResultColumn result={a} />
        <ResultColumn result={b} />
      </div>
    </div>
  );
}
