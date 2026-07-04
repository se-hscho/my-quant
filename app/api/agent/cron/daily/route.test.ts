import { describe, expect, it, vi, beforeEach } from "vitest";
import { clearBriefingMemoryForTests } from "@/services/briefing/kv";

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
  dispatchNotification: vi.fn(async () => ({ email: true, slack: true })),
}));

import { dispatchNotification } from "@/services/notifications/dispatch";
import { GET } from "./route";

const mockDispatch = vi.mocked(dispatchNotification);

describe("GET /api/agent/cron/daily", () => {
  beforeEach(() => {
    clearBriefingMemoryForTests();
    process.env.BRIEFING_DEV_MEMORY = "1";
    process.env.CRON_SECRET = "test-secret";
    mockDispatch.mockClear();
  });

  it("오늘 브리핑을 생성하고 아침 알림을 큐에 넣는다", async () => {
    const res = await GET(
      new Request("http://localhost/api/agent/cron/daily", {
        headers: { authorization: "Bearer test-secret" },
      })
    );

    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; date: string };
    expect(body.ok).toBe(true);

    await vi.waitFor(() => {
      expect(mockDispatch).toHaveBeenCalled();
    });

    const payload = mockDispatch.mock.calls[0][0];
    expect(payload.subject).toMatch(/아침 브리핑/);
    expect(payload.text).toMatch(/시나리오 비교/);
    expect(payload.html).toMatch(/상세 보기/);
  });
});
