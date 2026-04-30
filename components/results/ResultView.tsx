"use client";

import * as React from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { loadResult } from "@/lib/storage";
import type { PortfolioResult } from "@/types";
import { MetricCards } from "@/components/results/MetricCards";
import { EfficientFrontierChart } from "@/components/results/EfficientFrontierChart";
import { WeightPieChart } from "@/components/results/WeightPieChart";
import { BacktestChart } from "@/components/results/BacktestChart";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon } from "lucide-react";

const METHOD_LABEL: Record<string, string> = {
  "max-sharpe": "Max Sharpe",
  "min-variance": "Min Variance",
  "risk-parity": "Risk Parity",
};

export function ResultView({ id }: { id: string }) {
  const [result, setResult] = React.useState<PortfolioResult | null | undefined>(
    undefined
  );

  React.useEffect(() => {
    setResult(loadResult(id));
  }, [id]);

  if (result === undefined) {
    return <div className="container mx-auto p-8 text-sm text-muted-foreground">불러오는 중…</div>;
  }
  if (result === null) notFound();

  return (
    <main className="container mx-auto max-w-5xl px-4 py-8">
      <header className="mb-6 flex items-center gap-3">
        <Button asChild variant="outline" size="sm">
          <Link href={`/bundle/${result.bundleId}`}>
            <ArrowLeftIcon className="h-4 w-4" data-icon="inline-start" />
            번들로
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">{result.bundleName}</h1>
          <p className="text-sm text-muted-foreground">
            방법: {METHOD_LABEL[result.method] ?? result.method}
          </p>
        </div>
      </header>

      <section className="mb-6">
        <MetricCards metrics={result.metrics} />
      </section>

      <section className="mb-6 grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="mb-2 text-sm font-semibold">효율적 프론티어</h2>
          <EfficientFrontierChart
            frontier={result.frontier}
            optimal={{
              weights: result.weights,
              expectedReturn: result.metrics.annualReturn,
              volatility: result.metrics.volatility,
              sharpe: result.metrics.sharpe,
            }}
          />
        </div>
        <div>
          <h2 className="mb-2 text-sm font-semibold">최적 가중치</h2>
          <WeightPieChart weights={result.weights} />
        </div>
      </section>

      <section className="mb-6">
        <h2 className="mb-2 text-sm font-semibold">백테스팅</h2>
        <BacktestChart tickers={result.tickers} weights={result.weights} />
      </section>
    </main>
  );
}
