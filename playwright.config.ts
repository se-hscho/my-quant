import { defineConfig, devices } from "@playwright/test";

const baseURL =
  process.env.PLAYWRIGHT_BASE_URL?.replace(/\/$/, "") ||
  process.env.DEPLOY_URL?.replace(/\/$/, "") ||
  "http://localhost:3000";

const isRemoteTarget = !/^https?:\/\/localhost(?::\d+)?$/.test(baseURL);

const vercelBypass =
  process.env.VERCEL_AUTOMATION_BYPASS_SECRET ||
  process.env.VERCEL_PROTECTION_BYPASS;

const vercelHeaders = vercelBypass
  ? {
      "x-vercel-protection-bypass": vercelBypass,
      "x-vercel-set-bypass-cookie": "true",
    }
  : undefined;

export default defineConfig({
  testDir: "./e2e",
  testMatch: /.*\.spec\.ts$/,
  fullyParallel: !isRemoteTarget,
  retries: process.env.CI || isRemoteTarget ? 2 : 0,
  timeout: isRemoteTarget ? 120_000 : 60_000,
  reporter: [["html", { open: "never" }], ["list"]],
  use: {
    baseURL,
    trace: "on-first-retry",
    actionTimeout: isRemoteTarget ? 30_000 : 15_000,
    extraHTTPHeaders: vercelHeaders,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    ...(isRemoteTarget
      ? []
      : [
          {
            name: "chrome",
            use: { ...devices["Desktop Chrome"], channel: "chrome" },
          },
        ]),
  ],
  webServer: isRemoteTarget
    ? undefined
    : {
        command: "bun run dev",
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});
