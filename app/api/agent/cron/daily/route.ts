import { after, NextResponse } from "next/server";
import { generateBriefing } from "@/services/briefing/generate";
import { getBriefing, saveBriefing } from "@/services/briefing/kv";
import { formatMorningSummary } from "@/services/notifications/format-summary";
import { dispatchNotification } from "@/services/notifications/dispatch";
import { getNotificationSettings } from "@/services/notifications/settings-kv";
import { resolveDispatchTargets } from "@/services/notifications/resolve-targets";
import { createEmptySnapshot } from "@/lib/agent/holdings-storage";

export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const today = new Date().toISOString().slice(0, 10);
  let briefing = await getBriefing(today);
  if (!briefing) {
    try {
      briefing = await generateBriefing({ snapshot: createEmptySnapshot() });
      await saveBriefing(briefing);
    } catch {
      return NextResponse.json({ error: "briefing failed" }, { status: 503 });
    }
  }

  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";
  const reportUrl = `${baseUrl}/agent/report/${today}`;
  const formatted = formatMorningSummary(briefing, reportUrl);
  const settings = await getNotificationSettings();
  const targets = resolveDispatchTargets(settings);

  after(async () => {
    await dispatchNotification(formatted, targets);
  });

  return NextResponse.json({ ok: true, date: today });
}
