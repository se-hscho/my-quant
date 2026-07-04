import type { NotificationSettings } from "@/types/agent-settings";

export interface DispatchTargets {
  emailTo: string | null;
  slackWebhookUrl: string | null;
}

/** 사용자 설정(활성 채널) 우선, 없으면 운영 env 폴백 */
export function resolveDispatchTargets(
  settings: NotificationSettings,
  env: {
    notificationEmailTo?: string;
    slackWebhookUrl?: string;
  } = {}
): DispatchTargets {
  const opsEmail = env.notificationEmailTo ?? process.env.NOTIFICATION_EMAIL_TO ?? null;
  const opsSlack = env.slackWebhookUrl ?? process.env.SLACK_WEBHOOK_URL ?? null;

  const emailTo =
    settings.emailEnabled && settings.emailAddress.trim()
      ? settings.emailAddress.trim()
      : opsEmail;

  const slackWebhookUrl =
    settings.slackEnabled && settings.slackWebhookUrl.trim()
      ? settings.slackWebhookUrl.trim()
      : opsSlack;

  return { emailTo, slackWebhookUrl };
}
