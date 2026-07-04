"use client";

import type { Briefing } from "@/services/briefing/types";
import { ChartWithCaption } from "../ChartWithCaption";

export function InstitutionalLensSection({
  paragraphs,
}: {
  paragraphs: string[];
}) {
  return (
    <ChartWithCaption
      title="기관 vs 개인"
      caption="제약과 이점을 번역한 실행 렌즈"
      interpretation={paragraphs}
    >
      <p className="text-sm text-muted-foreground">
        스마트 머니 차트와 별도로, 실행 전략 관점의 요약입니다.
      </p>
    </ChartWithCaption>
  );
}
