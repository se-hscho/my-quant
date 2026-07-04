import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { dispatchNotification } from "./dispatch";

describe("dispatchNotification", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset();
    delete process.env.NOTIFICATION_EMAIL_TO;
    delete process.env.RESEND_API_KEY;
    delete process.env.RESEND_FROM;
    delete process.env.SLACK_WEBHOOK_URL;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("env 미설정 시 발송하지 않는다", async () => {
    const result = await dispatchNotification({
      subject: "test",
      text: "hello",
    });
    expect(result).toEqual({ email: false, slack: false });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("Resend env가 있으면 이메일을 발송한다", async () => {
    process.env.NOTIFICATION_EMAIL_TO = "user@example.com";
    process.env.RESEND_API_KEY = "re_test";
    fetchMock.mockResolvedValue({ ok: true });

    const result = await dispatchNotification({
      subject: "아침 브리핑",
      text: "요약",
      html: "<p>요약</p>",
    });

    expect(result.email).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.resend.com/emails",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("Slack webhook env가 있으면 Slack을 발송한다", async () => {
    process.env.SLACK_WEBHOOK_URL = "https://hooks.slack.com/test";
    fetchMock.mockResolvedValue({ ok: true });

    const result = await dispatchNotification({
      subject: "이벤트",
      text: "알림 본문",
    });

    expect(result.slack).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://hooks.slack.com/test",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("targets가 있으면 env 대신 targets를 사용한다", async () => {
    process.env.RESEND_API_KEY = "re_test";
    fetchMock.mockResolvedValue({ ok: true });

    await dispatchNotification(
      { subject: "t", text: "body" },
      { emailTo: "custom@example.com", slackWebhookUrl: "https://hooks.slack.com/custom" }
    );

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.resend.com/emails",
      expect.objectContaining({
        body: expect.stringContaining("custom@example.com"),
      })
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "https://hooks.slack.com/custom",
      expect.objectContaining({ method: "POST" })
    );
  });
});
