"use client";

import type { Briefing } from "@/services/briefing/types";
import { ChartWithCaption } from "../ChartWithCaption";

export function ContextSection({
  items,
}: {
  items: Briefing["sections"]["context"]["items"];
}) {
  return (
    <ChartWithCaption
      title="맥락 — 뉴스·공시·정책"
      caption="제안에 반영된 맥락 요약"
      interpretation={[
        "각 항목은 당일 브리핑 시나리오 선택에 미치는 영향을 한 문장으로 연결합니다.",
        "출처 링크를 열어 원문·공시를 직접 확인하세요.",
      ]}
    >
      <ul className="space-y-2 text-sm">
        {items.map((item) => (
          <li key={item.title} className="rounded-md border p-3">
            <span className="text-xs text-muted-foreground">
              [{item.type}] {item.date}
            </span>
            <p className="font-medium">{item.title}</p>
            <p className="text-muted-foreground">{item.impact}</p>
            {item.sourceUrl ? (
              <a
                href={item.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block text-xs text-primary underline-offset-2 hover:underline"
              >
                근거 확인 →
              </a>
            ) : null}
          </li>
        ))}
      </ul>
    </ChartWithCaption>
  );
}
