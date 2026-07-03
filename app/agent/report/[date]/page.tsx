import { Suspense } from "react";
import { ReportPageClient } from "@/components/agent/ReportPageClient";
import { Skeleton } from "@/components/ui/skeleton";

function ReportFallback() {
  return (
    <div className="space-y-3" aria-busy="true">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-96 w-full" />
    </div>
  );
}

export default function ReportPage({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  return (
    <Suspense fallback={<ReportFallback />}>
      <ReportPageClient params={params} />
    </Suspense>
  );
}
