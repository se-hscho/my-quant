import { expect, test } from "@playwright/test";
import { DEMO_PORTFOLIO_SNAPSHOT } from "@/lib/agent/demo-portfolio";
import { registerDeployPreflight } from "./helpers/deploy-preflight";

registerDeployPreflight();

test.describe("Agent briefing deploy smoke", () => {
  test("demo briefing API returns complete briefing (real Yahoo on server)", async ({
    request,
  }) => {
    const postRes = await request.post("/api/agent/briefing", {
      data: { snapshot: DEMO_PORTFOLIO_SNAPSHOT, demo: true },
    });

    if (postRes.status() === 503) {
      const body = await postRes.json().catch(() => ({}));
      throw new Error(
        `Briefing 503 on deploy — likely Yahoo ticker/FX failure: ${JSON.stringify(body)}`
      );
    }

    expect(postRes.ok()).toBeTruthy();
    const briefing = (await postRes.json()) as {
      status: string;
      summaryLines: string[];
      scenarios: unknown[];
      totalAssetsKrw: number;
    };
    expect(briefing.status).toBe("complete");
    expect(briefing.summaryLines.length).toBeGreaterThanOrEqual(3);
    expect(briefing.scenarios).toHaveLength(4);
    expect(briefing.totalAssetsKrw).toBeGreaterThan(0);
  });

  test("GET demo briefing for empty holdings preview", async ({ request }) => {
    const res = await request.get("/api/agent/briefing?demo=1");
    if (res.status() === 503) {
      const body = await res.json().catch(() => ({}));
      throw new Error(`Demo GET briefing failed: ${JSON.stringify(body)}`);
    }
    expect(res.ok()).toBeTruthy();
    const body = (await res.json()) as { briefing: { status: string } | null };
    expect(body.briefing?.status).toBe("complete");
  });

  test("/agent shows summary-page without holdings (deploy UI)", async ({ page }) => {
    await page.goto("/agent");
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.reload();

    await expect(page.getByTestId("demo-preview-banner")).toBeVisible({
      timeout: 90_000,
    });
    await expect(page.getByTestId("summary-page")).toBeVisible({
      timeout: 90_000,
    });
    await expect(page.getByText(/브리핑을 생성하지 못했습니다/)).not.toBeVisible();
  });
});
