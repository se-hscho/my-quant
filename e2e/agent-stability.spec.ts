import { expect, test } from "@playwright/test";
import { postAgentChat, REGISTER_REPLY } from "./helpers/agent-chat";
import { registerDeployPreflight } from "./helpers/deploy-preflight";

registerDeployPreflight();

test.describe("Agent stability", () => {
  test("chat status endpoint is stable across repeated calls", async ({
    request,
  }) => {
    for (let i = 0; i < 3; i++) {
      const res = await request.get("/api/agent/chat/status");
      expect(res.ok()).toBeTruthy();
      const body = (await res.json()) as {
        geminiConfigured: boolean;
        llmRateLimit?: { remaining: number; allowed: boolean };
      };
      expect(typeof body.geminiConfigured).toBe("boolean");
      if (body.llmRateLimit) {
        expect(body.llmRateLimit.remaining).toBeGreaterThanOrEqual(0);
      }
    }
  });

  test("sequential holdings registration does not corrupt state", async ({
    request,
  }) => {
    await postAgentChat(request, "삼전 10주");
    const second = await postAgentChat(request, "현금 오만원 추가");
    expect(second.actions[0]).toMatchObject({
      type: "set_cash",
      field: "krw",
      amount: 50_000,
    });
    const third = await postAgentChat(request, "SOXX 5주 등록");
    expectAddHoldingShape(third, "SOXX", 5);
  });

  test("valuation API returns valid shape for sample snapshot", async ({
    request,
  }) => {
    const res = await request.post("/api/agent/valuation", {
      data: {
        snapshot: {
          holdings: [
            {
              id: "1",
              ticker: "SOXX",
              quantity: 1,
              assetType: "etf",
              currency: "USD",
            },
          ],
          cash: { krw: 1_000_000, usd: 0, jpy: 0 },
          updatedAt: new Date().toISOString(),
        },
      },
    });

    if (res.status() === 502) {
      test.skip(true, "Yahoo FX unavailable in CI");
    }

    expect(res.ok()).toBeTruthy();
    const body = (await res.json()) as {
      totalKrw: number;
      cashKrw: number;
      holdingsKrw: number;
      fx: { usdKrw: number; jpyKrw: number };
    };
    expect(body.totalKrw).toBeGreaterThan(0);
    expect(body.fx.usdKrw).toBeGreaterThan(0);
    expect(body.fx.jpyKrw).toBeGreaterThan(0);
  });

  test("unrecognized chat returns structured reply without 500", async ({
    request,
  }) => {
    const res = await request.post("/api/agent/chat", {
      data: { message: "완전히 알 수 없는 문장 xyz123", snapshot: null },
    });
    expect(res.ok()).toBeTruthy();
    const body = (await res.json()) as { reply: string; actions: unknown[] };
    expect(body.reply.length).toBeGreaterThan(0);
    expect(Array.isArray(body.actions)).toBe(true);
  });
});

function expectAddHoldingShape(
  body: { actions: Array<{ type: string; ticker?: string; quantity?: number }> },
  ticker: string,
  quantity: number
) {
  expect(body.actions[0]).toMatchObject({
    type: "add_holding",
    ticker,
    quantity,
  });
  expect(body.reply).toMatch(REGISTER_REPLY);
}
