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
      caption={paragraphs[0] ?? "기관·개인 실행 제약 분석"}
      help={[
        "기관(13F·펀드)과 개인(소액·즉시 체결)의 차이를 실행 전략으로 번역합니다.",
        "스마트 머니 수치와 함께 읽으세요.",
      ]}
    >
      <ul className="list-disc space-y-2 pl-5 text-sm">
        {paragraphs.map((p) => (
          <li key={p}>{p}</li>
        ))}
      </ul>
    </ChartWithCaption>
  );
}
