import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { clearNotificationSettingsMemoryForTests } from "@/services/notifications/settings-kv";

vi.mock("@/services/notifications/dispatch", () => ({
  dispatchNotification: vi.fn(async () => ({ email: true, slack: false })),
}));

import { dispatchNotification } from "@/services/notifications/dispatch";
import { POST } from "./route";

const mockDispatch = vi.mocked(dispatchNotification);

describe("POST /api/agent/notifications/test", () => {
  beforeEach(() => {
    clearNotificationSettingsMemoryForTests();
    mockDispatch.mockClear();
  });

  it("채널 없으면 400", async () => {
    const res = await POST();
    expect(res.status).toBe(400);
    const body = (await res.json()) as { code: string };
    expect(body.code).toBe("NO_CHANNELS");
  });

  it("설정된 채널로 테스트 알림을 발송한다", async () => {
    process.env.NOTIFICATION_EMAIL_TO = "ops@example.com";
    process.env.RESEND_API_KEY = "re_test";

    const res = await POST();
    expect(res.status).toBe(200);
    expect(mockDispatch).toHaveBeenCalled();
    const body = (await res.json()) as { ok: boolean; email: boolean };
    expect(body.ok).toBe(true);
    expect(body.email).toBe(true);

    delete process.env.NOTIFICATION_EMAIL_TO;
    delete process.env.RESEND_API_KEY;
  });
});
