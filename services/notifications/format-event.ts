import { BRIEFING_DISCLAIMER } from "@/services/briefing/types";

export function formatEventAlert(input: {
  title: string;
  bullets: string[];
  rationale: string;
  reportUrl: string;
}): { subject: string; text: string } {
  const text = [
    `[이벤트] ${input.title}`,
    "",
    ...input.bullets.slice(0, 3).map((b) => `• ${b}`),
    "",
    `근거: ${input.rationale}`,
    `상세: ${input.reportUrl}`,
    "",
    BRIEFING_DISCLAIMER,
  ].join("\n");

  return {
    subject: `[포트폴리오] 이벤트 알림 — ${input.title}`,
    text,
  };
}
