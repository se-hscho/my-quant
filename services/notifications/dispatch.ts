import { sendEmail } from "./email";
import { sendSlackWebhook } from "./slack";
import type { DispatchTargets } from "./resolve-targets";

export interface NotificationPayload {
  subject: string;
  text: string;
  html?: string;
}

export interface DispatchResult {
  email: boolean;
  slack: boolean;
}

/** Resend·Slack로 알림을 발송한다. targets 미지정 시 env만 사용 */
export async function dispatchNotification(
  payload: NotificationPayload,
  targets?: DispatchTargets
): Promise<DispatchResult> {
  const result: DispatchResult = { email: false, slack: false };

  const emailTo = targets?.emailTo ?? process.env.NOTIFICATION_EMAIL_TO ?? null;
  if (emailTo) {
    result.email = await sendEmail({
      to: emailTo,
      subject: payload.subject,
      html: payload.html ?? `<pre>${payload.text}</pre>`,
      text: payload.text,
    });
  }

  const slackUrl = targets?.slackWebhookUrl ?? process.env.SLACK_WEBHOOK_URL ?? null;
  if (slackUrl) {
    result.slack = await sendSlackWebhook(slackUrl, payload.text);
  }

  return result;
}
