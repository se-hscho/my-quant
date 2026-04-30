"use client";

import { Loader2Icon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function LoadingView({ message }: { message: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      data-testid="optimization-loading"
      className="flex flex-col items-center gap-4 py-16"
    >
      <Loader2Icon className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm font-medium">{message}</p>
      <div className="grid w-full max-w-md gap-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-3/4" />
        <Skeleton className="h-3 w-2/3" />
      </div>
    </div>
  );
}
