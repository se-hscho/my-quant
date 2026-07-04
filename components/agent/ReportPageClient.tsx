"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { BriefingErrorInfo } from "@/types/agent-briefing";
import { BriefingFetchError } from "@/types/agent-briefing";
import { resolveBriefingDate } from "@/lib/agent/demo-portfolio";
import { loadReportBriefing } from "@/lib/agent/briefing-fetch";
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
  const { date: rawDate } = use(params);
  const date = resolveBriefingDate(rawDate);
  const searchParams = useSearchParams();
  const isDemoQuery = searchParams.get("demo") === "1";
  const [briefing, setBriefing] = useState<Awaited<
    ReturnType<typeof loadReportBriefing>
  >["briefing"] | null>(null);
  const [isDemo, setIsDemo] = useState(isDemoQuery);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<BriefingErrorInfo | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await loadReportBriefing(rawDate, isDemoQuery);
      setBriefing(result.briefing);
      setIsDemo(result.isDemo);
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
  }, [rawDate, isDemoQuery]);

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
      <p className="text-center text-xs text-muted-foreground">레포트 날짜: {date}</p>
    </div>
  );
}
