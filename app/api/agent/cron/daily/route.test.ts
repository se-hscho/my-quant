import { describe, expect, it, vi, beforeEach } from "vitest";
import { clearBriefingMemoryForTests } from "@/services/briefing/kv";
import { clearMorningNotificationMemoryForTests } from "@/services/notifications/morning-sent";
import {
  clearNotificationSettingsMemoryForTests,
  saveNotificationSettingsKv,
} from "@/services/notifications/settings-kv";

vi.mock("next/server", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/server")>();
  return {
    ...actual,
    after: (fn: () => void | Promise<void>) => {
      void fn();
    },
  };
});

vi.mock("@/lib/agent/yahoo-quote", () => ({
  fetchFxRatesFromYahoo: vi.fn(async () => ({ usdKrw: 1350, jpyKrw: 9.2 })),
  fetchYahooLatestClose: vi.fn(async () => 100),
  toYahooSymbol: (t: string) => t,
}));

vi.mock("@/services/notifications/dispatch", () => ({
  dispatchNotification: vi.fn(async () => ({ email: true, slack: false })),
}));

import { dispatchNotification } from "@/services/notifications/dispatch";
import { GET } from "./route";

const mockDispatch = vi.mocked(dispatchNotification);

describe("GET /api/agent/cron/daily", () => {
  beforeEach(() => {
    clearBriefingMemoryForTests();
    clearMorningNotificationMemoryForTests();
    clearNotificationSettingsMemoryForTests();
    process.env.BRIEFING_DEV_MEMORY = "1";
    process.env.CRON_SECRET = "test-secret";
    mockDispatch.mockClear();
  });

  it("설정 시각이 아니면 skipped", async () => {
    await saveNotificationSettingsKv({
      emailEnabled: false,
      emailAddress: "",
      slackEnabled: false,
      slackWebhookUrl: "",
      morningTimeKst: "07:00",
    });

    const res = await GET(
      new Request("http://localhost/api/agent/cron/daily", {
        headers: { authorization: "Bearer test-secret" },
      })
    );

    expect(res.status).toBe(200);
    const body = (await res.json()) as { skipped: boolean; reason: string };
    expect(body.skipped).toBe(true);
    expect(body.reason).toBe("not_scheduled_time");
    expect(mockDispatch).not.toHaveBeenCalled();
  });

  it("force=1이면 설정 시각과 무관하게 발송 큐에 넣는다", async () => {
    await saveNotificationSettingsKv({
      emailEnabled: true,
      emailAddress: "user@example.com",
      slackEnabled: false,
      slackWebhookUrl: "",
      morningTimeKst: "07:00",
    });

    const res = await GET(
      new Request("http://localhost/api/agent/cron/daily?force=1", {
        headers: { authorization: "Bearer test-secret" },
      })
    );

    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; date: string };
    expect(body.ok).toBe(true);

    await vi.waitFor(() => {
      expect(mockDispatch).toHaveBeenCalled();
    });
  });
});
