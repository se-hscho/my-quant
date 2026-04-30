"use client";

import * as React from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getBundleById } from "@/config/bundles";
import type { OptimizationMethod, Stock } from "@/types";
import { StockList } from "@/components/bundle/StockList";
import { OptimizationPanel } from "@/components/bundle/OptimizationPanel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeftIcon } from "lucide-react";

export interface BundleDetailViewProps {
  bundleId: string;
}

export function BundleDetailView({ bundleId }: BundleDetailViewProps) {
  const bundle = getBundleById(bundleId);
  if (!bundle) notFound();

  const [stocks, setStocks] = React.useState<Stock[]>(bundle.stocks);
  const [method, setMethod] = React.useState<OptimizationMethod>("max-sharpe");

  // Task 5에서 useOptimization 훅으로 교체됨. 임시 noop.
  const handleRun = React.useCallback(() => {
    if (typeof window !== "undefined") {
      console.info("optimize", { bundleId, method, tickers: stocks.map((s) => s.ticker) });
    }
  }, [bundleId, method, stocks]);

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
            onRun={handleRun}
            disabled={stocks.length < 2}
          />
        </section>
      </div>
    </main>
  );
}
