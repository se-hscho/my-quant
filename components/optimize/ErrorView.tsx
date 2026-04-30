"use client";

import { AlertTriangleIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface ErrorViewProps {
  onRetry: () => void;
  message?: string;
}

export function ErrorView({ onRetry }: ErrorViewProps) {
  return (
    <div
      role="alert"
      data-testid="optimization-error"
      className="flex flex-col items-center gap-4 py-16"
    >
      <AlertTriangleIcon className="h-8 w-8 text-destructive" />
      <p className="text-sm font-medium">
        데이터를 가져오지 못했습니다. 잠시 후 다시 시도해주세요.
      </p>
      <Button onClick={onRetry}>재시도</Button>
    </div>
  );
}
