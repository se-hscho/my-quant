"use client";

import type { Briefing } from "@/services/briefing/types";
import { formatScenarioReference } from "@/config/agent-scenarios";
import { ChartWithCaption } from "../ChartWithCaption";

const phaseLabel = { before: "이벤트 전", today: "당일", after: "이벤트 후" };

export function EventsSection({
  timeline,
}: {
  timeline: Briefing["sections"]["events"]["timeline"];
}) {
  const todayEvent = timeline.find((e) => e.phase === "today");

  return (
    <ChartWithCaption
      title="이벤트 타임라인"
      caption={
        todayEvent
          ? `당일 ${todayEvent.title} — ${todayEvent.bullets[0]?.direction ?? "검토 필요"}`
          : timeline.length > 0
            ? `${timeline.length}건 이벤트 · ${timeline[0].title}`
            : "임박 이벤트 없음"
      }
      help={[
        `이벤트 전후 ${formatScenarioReference(3)} vs ${formatScenarioReference(1)}을 비교하세요.`,
        "각 bullet direction·rationale은 당일 분석 결과입니다.",
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
