import { expect, test } from "@playwright/test";
import {
  expectAddHolding,
  expectSetCash,
  postAgentChat,
  REGISTER_REPLY,
} from "./helpers/agent-chat";

test.describe("Agent natural language API", () => {
  test("반도체 etf 10주 샀어 → SOXX", async ({ request }) => {
    const body = await postAgentChat(request, "반도체 etf 10주 샀어");
    expectAddHolding(body, { ticker: "SOXX", quantity: 10 });
  });

  test("필라델피아 반도체 etf 10주 샀어 → SOXX", async ({ request }) => {
    const body = await postAgentChat(request, "필라델피아 반도체 etf 10주 샀어");
    expectAddHolding(body, { ticker: "SOXX", quantity: 10 });
  });

  test("삼전 10주 → 005930.KS", async ({ request }) => {
    const body = await postAgentChat(request, "삼전 10주");
    expectAddHolding(body, { ticker: "005930.KS", quantity: 10 });
  });

  test("SK하이닉스 5주 샀어 → 000660.KS", async ({ request }) => {
    const body = await postAgentChat(request, "SK하이닉스 5주 샀어");
    expectAddHolding(body, { ticker: "000660.KS", quantity: 5 });
  });

  test("현금 오만원 추가 → KRW 50000", async ({ request }) => {
    const body = await postAgentChat(request, "현금 오만원 추가");
    expectSetCash(body, { field: "krw", amount: 50_000 });
  });

  test("Gemini status endpoint is reachable", async ({ request }) => {
    const res = await request.get("/api/agent/chat/status");
    expect(res.ok()).toBeTruthy();
    const body = (await res.json()) as {
      geminiConfigured: boolean;
      defaultModel: string;
    };
    expect(body.defaultModel).toBe("gemini-2.5-flash");
    expect(typeof body.geminiConfigured).toBe("boolean");
  });
});

test.describe("Agent natural language UI", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/agent");
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.reload();
  });

  async function sendChat(page: import("@playwright/test").Page, message: string) {
    const input = page.getByLabel("에이전트에게 질문");
    await expect(input).toBeEnabled({ timeout: 30_000 });
    await input.fill(message);
    await page.getByLabel("질문 보내기").click();
    await expect(page.getByText(REGISTER_REPLY).first()).toBeVisible({
      timeout: 90_000,
    });
  }

  test("반도체 etf 10주 샀어 → SOXX 보유 등록", async ({ page }) => {
    await sendChat(page, "반도체 etf 10주 샀어");
    await expect(page.getByText(/보유가 등록되었습니다/)).toBeVisible({
      timeout: 15_000,
    });

    const holdings = await page.evaluate(() =>
      localStorage.getItem("agent:holdings:v1")
    );
    expect(holdings).toContain("SOXX");
  });

  test("삼전 10주 → 005930.KS 보유 등록", async ({ page }) => {
    await sendChat(page, "삼전 10주");
    const holdings = await page.evaluate(() =>
      localStorage.getItem("agent:holdings:v1")
    );
    expect(holdings).toContain("005930.KS");
  });
});
