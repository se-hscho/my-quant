"use client";

import * as React from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getBundleById } from "@/config/bundles";
import { getCustomBundleById } from "@/lib/custom-bundles";
import type { Bundle, OptimizationMethod, Stock } from "@/types";
import { StockList } from "@/components/bundle/StockList";
import { OptimizationPanel } from "@/components/bundle/OptimizationPanel";
import { LoadingView } from "@/components/optimize/LoadingView";
import { ErrorView } from "@/components/optimize/ErrorView";
import { useOptimization } from "@/hooks/useOptimization";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeftIcon } from "lucide-react";

export interface BundleDetailViewProps {
  bundleId: string;
}

export function BundleDetailView({ bundleId }: BundleDetailViewProps) {
  const [bundle, setBundle] = React.useState<Bundle | null | undefined>(undefined);
  const [stocks, setStocks] = React.useState<Stock[]>([]);
  const [method, setMethod] = React.useState<OptimizationMethod>("max-sharpe");

  React.useEffect(() => {
    const found = getBundleById(bundleId) ?? getCustomBundleById(bundleId) ?? null;
    setBundle(found);
    if (found) setStocks(found.stocks);
  }, [bundleId]);

  React.useEffect(() => {
    if (bundle === null) notFound();
  }, [bundle]);

  const opt = useOptimization({
    bundleId,
    bundleName: bundle?.name ?? "",
    method,
    tickers: stocks.map((s) => s.ticker),
  });

  if (bundle === undefined || bundle === null) return null;

  const isLoading = opt.status === "fetching" || opt.status === "computing" || opt.status === "done";
  const isError = opt.status === "error";

  return (
    <main className="container mx-auto max-w-4xl px-4 py-8">
      <header className="mb-6 flex items-center gap-3">
        <Button asChild variant="outline" size="sm">
          <Link href="/">
            <ArrowLeftIcon className="h-4 w-4" data-icon="inline-start" />
            번들로
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{bundle.category}</Badge>
            <h1 className="text-xl font-bold">{bundle.name}</h1>
          </div>
          <p className="text-sm text-muted-foreground">{bundle.description}</p>
        </div>
      </header>

      {isError ? (
        <ErrorView onRetry={opt.retry} message={opt.error ?? undefined} />
      ) : isLoading ? (
        <LoadingView message={opt.message} />
      ) : (
        <div className="grid gap-6 md:grid-cols-[2fr_1fr]">
          <section>
            <h2 className="mb-3 text-sm font-semibold">종목</h2>
            <StockList stocks={stocks} onChange={setStocks} />
          </section>
          <section>
            <h2 className="mb-3 text-sm font-semibold">최적화 설정</h2>
            <OptimizationPanel
              method={method}
              onMethodChange={setMethod}
              onRun={opt.run}
              disabled={stocks.length < 2}
            />
          </section>
        </div>
      )}
    </main>
  );
}

