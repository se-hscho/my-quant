"use client";

import * as React from "react";
import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CompareView } from "@/components/compare/CompareView";
import { loadResultRemoteFallback } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon } from "lucide-react";
import type { PortfolioResult } from "@/types";

function CompareInner() {
  const sp = useSearchParams();
  const aId = sp.get("a");
  const bId = sp.get("b");
  const [pair, setPair] = React.useState<{
    a: PortfolioResult | null;
    b: PortfolioResult | null;
  }>({ a: null, b: null });

  React.useEffect(() => {
    let cancelled = false;
    Promise.all([
      aId ? loadResultRemoteFallback(aId) : Promise.resolve(null),
      bId ? loadResultRemoteFallback(bId) : Promise.resolve(null),
    ]).then(([a, b]) => {
      if (!cancelled) setPair({ a, b });
    });
    return () => {
      cancelled = true;
    };
  }, [aId, bId]);

  return <CompareView a={pair.a} b={pair.b} />;
}

export default function ComparePage() {
  return (
    <main className="container mx-auto max-w-5xl px-4 py-8">
      <header className="mb-6 flex items-center gap-3">
        <Button asChild variant="outline" size="sm">
          <Link href="/history">
            <ArrowLeftIcon className="h-4 w-4" data-icon="inline-start" />
            기록으로
          </Link>
        </Button>
        <h1 className="text-xl font-bold">비교</h1>
      </header>
      <Suspense fallback={<div className="text-sm text-muted-foreground">불러오는 중…</div>}>
        <CompareInner />
      </Suspense>
    </main>
  );
}
