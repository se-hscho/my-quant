import { expect, test } from "@playwright/test";
import { registerDeployPreflight } from "./helpers/deploy-preflight";

registerDeployPreflight();

test("agent entry loads", async ({ page }) => {
  await page.goto("/agent");
  await expect(page.getByTestId("agent-chat-dock")).toBeVisible();
  await expect(page).toHaveTitle(/퀀트|포트폴리오|Kanban/i);
});
