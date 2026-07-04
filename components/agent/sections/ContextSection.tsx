"use client";

import type { Briefing } from "@/services/briefing/types";
import { ChartWithCaption } from "../ChartWithCaption";

export function ContextSection({
  items,
}: {
  items: Briefing["sections"]["context"]["items"];
}) {
  const caption =
    items.length === 0
      ? "당일 반영 맥락 없음"
      : items.map((i) => i.title).slice(0, 2).join(" · ") +
        (items.length > 2 ? ` 외 ${items.length - 2}건` : "");

  return (
    <ChartWithCaption
      title="맥락 — 뉴스·공시·정책"
      caption={caption}
      help={[
        "각 항목 impact는 당일 시나리오·검토안에 반영된 분석입니다.",
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
            <p>{item.impact}</p>
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
