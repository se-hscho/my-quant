import type { HoldingsSnapshot } from "@/types/agent";
import { generateBriefing } from "@/services/briefing/generate";
import { saveBriefing } from "@/services/briefing/kv";

export async function regenerateBriefingOnEvent(
  snapshot: HoldingsSnapshot
): Promise<{ ok: boolean; date?: string }> {
  try {
    const briefing = await generateBriefing({ snapshot });
    const saved = await saveBriefing(briefing);
    return { ok: saved, date: briefing.date };
  } catch {
    return { ok: false };
  }
}
