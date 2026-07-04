import { sendEmail } from "./email";
import { sendSlackWebhook } from "./slack";

export interface NotificationPayload {
  subject: string;
  text: string;
  html?: string;
}

export interface DispatchResult {
  email: boolean;
  slack: boolean;
}

/** Resend·Slack env가 설정된 채널로 알림을 발송한다. */
export async function dispatchNotification(
  payload: NotificationPayload
): Promise<DispatchResult> {
  const result: DispatchResult = { email: false, slack: false };

  const emailTo = process.env.NOTIFICATION_EMAIL_TO;
  if (emailTo) {
    result.email = await sendEmail({
      to: emailTo,
      subject: payload.subject,
      html: payload.html ?? `<pre>${payload.text}</pre>`,
      text: payload.text,
    });
  }

  const slackUrl = process.env.SLACK_WEBHOOK_URL;
  if (slackUrl) {
    result.slack = await sendSlackWebhook(slackUrl, payload.text);
  }

  return result;
}
