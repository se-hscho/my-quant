"use client";

import type { Briefing } from "@/services/briefing/types";
import { ChartWithCaption } from "../ChartWithCaption";

const phaseLabel = { before: "이벤트 전", today: "당일", after: "이벤트 후" };

export function EventsSection({
  timeline,
}: {
  timeline: Briefing["sections"]["events"]["timeline"];
}) {
  return (
    <ChartWithCaption
      title="이벤트 타임라인"
      caption="전·당일·후 검토 방향"
      interpretation={[
        "이벤트 전후로 안 3(최소변경)과 안 1(Follow)을 비교하세요.",
        "각 bullet에 근거 문장이 포함되어 있습니다.",
      ]}
    >
      <div className="space-y-3">
        {timeline.map((ev) => (
          <div key={ev.title} className="rounded-md border p-3 text-sm">
            <p className="font-medium">
              [{phaseLabel[ev.phase]}] {ev.title}
            </p>
            <ul className="mt-2 list-disc pl-5">
              {ev.bullets.map((b) => (
                <li key={b.direction}>
                  {b.direction} — <span className="text-muted-foreground">{b.rationale}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </ChartWithCaption>
  );
}
