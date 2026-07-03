"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export interface BriefingErrorStateProps {
  onRetry: () => void;
  loading?: boolean;
}

export function BriefingErrorState({ onRetry, loading }: BriefingErrorStateProps) {
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
        <Button type="button" onClick={onRetry} disabled={loading}>
          {loading ? "재시도 중…" : "재시도"}
        </Button>
      </CardContent>
    </Card>
  );
}
