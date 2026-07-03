import { expect, test } from "@playwright/test";

const REGISTER_REPLY = /등록했습니다|반영했습니다/;

test.describe("Agent API", () => {
  test("GET /api/agent/chat/status returns health payload", async ({ request }) => {
    const res = await request.get("/api/agent/chat/status");
    expect(res.ok()).toBeTruthy();

    const body = (await res.json()) as {
      geminiConfigured: boolean;
      defaultModel: string;
      geminiActive?: boolean;
    };

    expect(body).toMatchObject({
      geminiConfigured: expect.any(Boolean),
      defaultModel: "gemini-2.5-flash",
    });
  });

  test("POST /api/agent/chat registers 삼전 10주", async ({ request }) => {
    const res = await request.post("/api/agent/chat", {
      data: { message: "삼전 10주", snapshot: null },
    });
    expect(res.ok()).toBeTruthy();

    const body = (await res.json()) as {
      reply: string;
      actions: Array<{ type: string; ticker?: string; quantity?: number }>;
    };

    expect(body.actions[0]).toMatchObject({
      type: "add_holding",
      ticker: "005930.KS",
      quantity: 10,
    });
    expect(body.reply).toMatch(REGISTER_REPLY);
    expect(body.reply).not.toMatch(/명령을 이해하지 못했습니다/);
  });

  test("POST /api/agent/chat registers SOXX 10주 등록", async ({ request }) => {
    const res = await request.post("/api/agent/chat", {
      data: { message: "SOXX 10주 등록", snapshot: null },
    });
    expect(res.ok()).toBeTruthy();

    const body = (await res.json()) as {
      reply: string;
      actions: Array<{ type: string; ticker?: string; quantity?: number }>;
    };

    expect(body.actions[0]).toMatchObject({
      type: "add_holding",
      ticker: "SOXX",
      quantity: 10,
    });
    expect(body.reply).toMatch(REGISTER_REPLY);
  });
});

test.describe("Agent UI", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/agent");
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.reload();
  });

  test("agent page shows chat dock", async ({ page }) => {
    await expect(page.getByTestId("agent-chat-dock")).toBeVisible();
    await expect(page.getByLabel("에이전트에게 질문")).toBeEnabled({
      timeout: 30_000,
    });
  });

  test("삼전 10주 입력 시 보유가 등록된다", async ({ page }) => {
    const input = page.getByLabel("에이전트에게 질문");
    await expect(input).toBeEnabled({ timeout: 30_000 });

    await input.fill("삼전 10주");
    await page.getByLabel("질문 보내기").click();

    await expect(page.getByText(REGISTER_REPLY).first()).toBeVisible({
      timeout: 90_000,
    });
    await expect(page.getByText(/보유가 등록되었습니다/)).toBeVisible({
      timeout: 15_000,
    });

    const holdings = await page.evaluate(() =>
      localStorage.getItem("agent:holdings:v1")
    );
    expect(holdings).toContain("005930.KS");
  });
});
