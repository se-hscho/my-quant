import { after, NextResponse } from "next/server";
import type { HoldingsSnapshot } from "@/types/agent";
import { regenerateBriefingOnEvent } from "@/services/briefing/regenerate-on-event";
import { getBriefing } from "@/services/briefing/kv";
import { formatEventAlert } from "@/services/notifications/format-event";
import { sendEmail } from "@/services/notifications/email";
import { sendSlackWebhook } from "@/services/notifications/slack";

export async function POST(request: Request) {
  const auth = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let snapshot: HoldingsSnapshot;
  let eventTitle = "주요 이벤트";
  try {
    const body = (await request.json()) as {
      snapshot?: HoldingsSnapshot;
      eventTitle?: string;
    };
    if (!body.snapshot) {
      return NextResponse.json({ error: "snapshot required" }, { status: 400 });
    }
    snapshot = body.snapshot;
    eventTitle = body.eventTitle ?? eventTitle;
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  const regen = await regenerateBriefingOnEvent(snapshot);
  if (!regen.ok || !regen.date) {
    return NextResponse.json({ error: "regenerate failed" }, { status: 503 });
  }

  const briefing = await getBriefing(regen.date);
  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";

  after(async () => {
    if (!briefing) return;
    const alert = formatEventAlert({
      title: eventTitle,
      bullets: briefing.summaryLines.slice(0, 3),
      rationale: briefing.fxRebalanceLine,
      reportUrl: `${baseUrl}/agent/report/${regen.date}`,
    });
    const emailTo = process.env.NOTIFICATION_EMAIL_TO;
    if (emailTo) {
      await sendEmail({
        to: emailTo,
        subject: alert.subject,
        html: `<pre>${alert.text}</pre>`,
        text: alert.text,
      });
    }
    const slackUrl = process.env.SLACK_WEBHOOK_URL;
    if (slackUrl) {
      await sendSlackWebhook(slackUrl, alert.text);
    }
  });

  return NextResponse.json({ ok: true, date: regen.date });
}
