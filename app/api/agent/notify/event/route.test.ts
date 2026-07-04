import { describe, expect, it, vi, beforeEach } from "vitest";
import { DEMO_PORTFOLIO_SNAPSHOT } from "@/lib/agent/demo-portfolio";
import { clearBriefingMemoryForTests } from "@/services/briefing/kv";
import "@/services/briefing/generate.test-setup";

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
import { POST } from "./route";

const mockDispatch = vi.mocked(dispatchNotification);

describe("POST /api/agent/notify/event", () => {
  beforeEach(() => {
    clearBriefingMemoryForTests();
    process.env.BRIEFING_DEV_MEMORY = "1";
    process.env.CRON_SECRET = "test-secret";
    mockDispatch.mockClear();
  });

  it("브리핑 재생성 후 이벤트 알림을 큐에 넣는다", async () => {
    const res = await POST(
      new Request("http://localhost/api/agent/notify/event", {
        method: "POST",
        headers: {
          authorization: "Bearer test-secret",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          snapshot: DEMO_PORTFOLIO_SNAPSHOT,
          eventTitle: "CPI 발표",
        }),
      })
    );

    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; date: string };
    expect(body.ok).toBe(true);
    expect(body.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);

    await vi.waitFor(() => {
      expect(mockDispatch).toHaveBeenCalled();
    });

    const payload = mockDispatch.mock.calls[0][0];
    expect(payload.subject).toMatch(/CPI 발표/);
    expect(payload.text).toMatch(/상세:/);
  });
});
