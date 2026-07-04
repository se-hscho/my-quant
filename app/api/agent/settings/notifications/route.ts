import { NextResponse } from "next/server";
import type { NotificationSettings } from "@/types/agent-settings";
import {
  defaultNotificationSettings,
  getNotificationSettings,
  saveNotificationSettingsKv,
} from "@/services/notifications/settings-kv";

function parseSettings(body: unknown): NotificationSettings | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;
  return {
    emailEnabled: Boolean(b.emailEnabled),
    emailAddress: typeof b.emailAddress === "string" ? b.emailAddress.trim() : "",
    slackEnabled: Boolean(b.slackEnabled),
    slackWebhookUrl:
      typeof b.slackWebhookUrl === "string" ? b.slackWebhookUrl.trim() : "",
    morningTimeKst:
      typeof b.morningTimeKst === "string" && b.morningTimeKst
        ? b.morningTimeKst
        : defaultNotificationSettings().morningTimeKst,
  };
}

export async function GET() {
  const settings = await getNotificationSettings();
  return NextResponse.json({ settings });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  const settings = parseSettings(body);
  if (!settings) {
    return NextResponse.json({ error: "invalid settings" }, { status: 400 });
  }

  await saveNotificationSettingsKv(settings);
  return NextResponse.json({ ok: true, settings });
}
