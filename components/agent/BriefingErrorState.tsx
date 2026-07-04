"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { BriefingErrorInfo } from "@/types/agent-briefing";

export interface BriefingErrorStateProps {
  onRetry: () => void;
  loading?: boolean;
  error?: BriefingErrorInfo | null;
}

export function BriefingErrorState({ onRetry, loading, error }: BriefingErrorStateProps) {
  const [showDetail, setShowDetail] = useState(false);

  return (
    <Card data-testid="briefing-error-state">
      <CardHeader>
        <CardTitle className="text-base">브리핑을 생성하지 못했습니다</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <p className="text-muted-foreground">
          시세·환율 또는 저장소 연결 문제일 수 있습니다. 잠시 후 다시 시도해 주세요.
          불완전한 시나리오 안은 표시하지 않습니다.
        </p>

        {error ? (
          <div className="space-y-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-muted-foreground"
              aria-expanded={showDetail}
              onClick={() => setShowDetail((v) => !v)}
            >
              {showDetail ? "고급 정보 숨기기" : "고급 정보 보기"}
            </Button>
            {showDetail ? (
              <div
                className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-xs"
                data-testid="briefing-error-detail"
                role="alert"
              >
                <p className="font-mono font-medium text-destructive">
                  [{error.code}]
                  {error.httpStatus != null ? ` HTTP ${error.httpStatus}` : ""}
                </p>
                <p className="mt-1 text-foreground">{error.message}</p>
                {error.detail ? (
                  <p className="mt-2 break-all font-mono text-muted-foreground">
                    {error.detail}
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}

        <Button type="button" onClick={onRetry} disabled={loading}>
          {loading ? "재시도 중…" : "재시도"}
        </Button>
      </CardContent>
    </Card>
  );
}
