import { describe, expect, it } from "vitest";
import { resolveDispatchTargets } from "./resolve-targets";
import { defaultNotificationSettings } from "./settings-kv";

describe("resolveDispatchTargets", () => {
  it("사용자 이메일·Slack 설정이 활성이면 해당 주소를 사용한다", () => {
    const settings = {
      ...defaultNotificationSettings(),
      emailEnabled: true,
      emailAddress: "user@example.com",
      slackEnabled: true,
      slackWebhookUrl: "https://hooks.slack.com/user",
    };

    expect(resolveDispatchTargets(settings, {})).toEqual({
      emailTo: "user@example.com",
      slackWebhookUrl: "https://hooks.slack.com/user",
    });
  });

  it("채널 비활성 시 운영 env 폴백", () => {
    expect(
      resolveDispatchTargets(defaultNotificationSettings(), {
        notificationEmailTo: "ops@example.com",
        slackWebhookUrl: "https://hooks.slack.com/ops",
      })
    ).toEqual({
      emailTo: "ops@example.com",
      slackWebhookUrl: "https://hooks.slack.com/ops",
    });
  });

  it("활성 채널이 비어 있으면 env도 없을 때 null", () => {
    expect(resolveDispatchTargets(defaultNotificationSettings(), {})).toEqual({
      emailTo: null,
      slackWebhookUrl: null,
    });
  });
});
