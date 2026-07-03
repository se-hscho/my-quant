import { after, NextResponse } from "next/server";
import { generateBriefing } from "@/services/briefing/generate";
import { getBriefing, saveBriefing } from "@/services/briefing/kv";
import { formatMorningSummary } from "@/services/notifications/format-summary";
import { sendEmail } from "@/services/notifications/email";
import { sendSlackWebhook } from "@/services/notifications/slack";
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

  after(async () => {
    const emailTo = process.env.NOTIFICATION_EMAIL_TO;
    if (emailTo) {
      await sendEmail({
        to: emailTo,
        subject: formatted.subject,
        html: formatted.html,
        text: formatted.text,
      });
    }
    const slackUrl = process.env.SLACK_WEBHOOK_URL;
    if (slackUrl) {
      await sendSlackWebhook(slackUrl, formatted.text);
    }
  });

  return NextResponse.json({ ok: true, date: today });
}
