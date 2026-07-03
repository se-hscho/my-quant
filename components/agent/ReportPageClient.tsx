"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { Briefing } from "@/services/briefing/types";
import { ReportPageContent } from "./ReportPageContent";
import { DemoPreviewBanner } from "./DemoPreviewBanner";
import { BriefingErrorState } from "./BriefingErrorState";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export function ReportPageClient({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const { date } = use(params);
  const searchParams = useSearchParams();
  const isDemo = searchParams.get("demo") === "1";
  const [briefing, setBriefing] = useState<Briefing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const q = isDemo ? "?demo=1" : "";
      const res = await fetch(`/api/agent/briefing/${date}${q}`, { cache: "no-store" });
      if (!res.ok) throw new Error("not found");
      const b = (await res.json()) as Briefing;
      if (b.status !== "complete") throw new Error("incomplete");
      setBriefing(b);
    } catch {
      setError(true);
      setBriefing(null);
    } finally {
      setLoading(false);
    }
  }, [date, isDemo]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <div className="space-y-3" aria-busy="true">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error || !briefing) {
    return (
      <div className="space-y-4">
        <BriefingErrorState onRetry={() => void load()} loading={loading} />
        <Button variant="outline" size="sm" asChild>
          <Link href="/agent">요약으로 돌아가기</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {isDemo ? <DemoPreviewBanner /> : null}
      <ReportPageContent briefing={briefing} />
    </div>
  );
}
