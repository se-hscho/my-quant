import { expect, test } from "@playwright/test";
import { REGISTER_REPLY } from "./helpers/agent-chat";
import { registerDeployPreflight } from "./helpers/deploy-preflight";

registerDeployPreflight();

test.describe("Agent usability", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/agent");
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.reload();
  });

  test("empty state guides user to register holdings", async ({ page }) => {
    await expect(page.getByText(/보유|등록|시작/i).first()).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByTestId("agent-chat-dock")).toBeVisible();
    await expect(page.getByLabel("에이전트에게 질문")).toBeEnabled();
  });

  test("quick prompt 도움말 works without registration", async ({ page }) => {
    const helpBtn = page.getByRole("button", { name: "도움말" });
    await expect(helpBtn).toBeVisible({ timeout: 30_000 });
    await helpBtn.click();
    await expect(page.getByText(/도움말|등록|보유/i).first()).toBeVisible({
      timeout: 15_000,
    });
  });

  test("after registration dashboard shows portfolio value card", async ({
    page,
  }) => {
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

    await expect(page.getByTestId("portfolio-value-card")).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByTestId("summary-page")).toBeVisible({
      timeout: 60_000,
    });
    await expect(page.getByRole("link", { name: "상세 레포트 보기" })).toBeVisible();
  });

  test("holdings edit page is reachable from header", async ({ page }) => {
    await page.getByRole("link", { name: "보유 편집" }).click();
    await expect(page).toHaveURL(/\/agent\/holdings/);
  });

  test("chat dock shows rules-first or offline badge", async ({ page }) => {
    await expect(
      page.getByText(/규칙 우선|오프라인 규칙|AI 확인/)
    ).toBeVisible({ timeout: 30_000 });
  });
});
