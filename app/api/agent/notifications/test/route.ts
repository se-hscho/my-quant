import { NextResponse } from "next/server";
import { BRIEFING_DISCLAIMER } from "@/services/briefing/types";
import { dispatchNotification } from "@/services/notifications/dispatch";
import { getNotificationSettings } from "@/services/notifications/settings-kv";
import { resolveDispatchTargets } from "@/services/notifications/resolve-targets";

export async function POST() {
  const settings = await getNotificationSettings();
  const targets = resolveDispatchTargets(settings);

  if (!targets.emailTo && !targets.slackWebhookUrl) {
    return NextResponse.json(
      {
        error: "활성화된 알림 채널이 없습니다. 이메일 또는 Slack을 설정해 주세요.",
        code: "NO_CHANNELS",
      },
      { status: 400 }
    );
  }

  const text = [
    "포트폴리오 에이전트 — 테스트 알림",
    "",
    "설정하신 채널로 알림이 도달하면 아침·이벤트 알림도 같은 경로로 발송됩니다.",
    "",
    BRIEFING_DISCLAIMER,
  ].join("\n");

  const result = await dispatchNotification(
    {
      subject: "[포트폴리오] 테스트 알림",
      text,
      html: `<p>${text.replace(/\n/g, "<br/>")}</p>`,
    },
    targets
  );

  if (!result.email && !result.slack) {
    return NextResponse.json(
      {
        error: "발송에 실패했습니다. RESEND_API_KEY 또는 Webhook URL을 확인해 주세요.",
        code: "DISPATCH_FAILED",
      },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true, ...result });
}
