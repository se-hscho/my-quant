import { test } from "@playwright/test";

export const isDeployTarget = Boolean(
  process.env.PLAYWRIGHT_BASE_URL || process.env.DEPLOY_URL
);

/** 배포 URL 사전 검사 — Vercel Deployment Protection 시 skip */
export function registerDeployPreflight() {
  test.beforeAll(async ({ request }) => {
    if (!isDeployTarget) return;

    const res = await request.get("/api/agent/chat/status");
    if (res.ok()) return;

    const hint =
      res.status() === 302 || res.status() === 401
        ? "Vercel Deployment Protection — VERCEL_AUTOMATION_BYPASS_SECRET 환경 변수 필요"
        : `배포 URL 응답 HTTP ${res.status()}`;

    test.skip(true, hint);
  });
}
