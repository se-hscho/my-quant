"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { Briefing } from "@/services/briefing/types";
import type { BriefingErrorInfo } from "@/types/agent-briefing";
import { BriefingFetchError } from "@/types/agent-briefing";
import { fetchBriefingByDate } from "@/lib/agent/briefing-fetch";
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
  const [error, setError] = useState<BriefingErrorInfo | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const b = await fetchBriefingByDate(date, isDemo);
      setBriefing(b);
    } catch (e) {
      setBriefing(null);
      if (e instanceof BriefingFetchError) {
        setError(e.info);
      } else {
        setError({
          code: "UNKNOWN",
          message: e instanceof Error ? e.message : "브리핑 로드 실패",
        });
      }
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
        <BriefingErrorState onRetry={() => void load()} loading={loading} error={error} />
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
