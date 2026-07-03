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
        "단독 뉴스가 아닌 포트폴리오 맥락에서 해석하세요.",
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
          </li>
        ))}
      </ul>
    </ChartWithCaption>
  );
}
