import { describe, expect, it, beforeEach } from "vitest";
import { clearNotificationSettingsMemoryForTests } from "@/services/notifications/settings-kv";
import { GET, POST } from "./route";

describe("/api/agent/settings/notifications", () => {
  beforeEach(() => {
    clearNotificationSettingsMemoryForTests();
  });

  it("GET — 기본 설정", async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    const body = (await res.json()) as { settings: { morningTimeKst: string } };
    expect(body.settings.morningTimeKst).toBe("07:00");
  });

  it("POST — 설정 저장 후 GET으로 확인", async () => {
    const post = await POST(
      new Request("http://localhost/api/agent/settings/notifications", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          emailEnabled: true,
          emailAddress: "me@example.com",
          slackEnabled: false,
          slackWebhookUrl: "",
          morningTimeKst: "08:30",
        }),
      })
    );
    expect(post.status).toBe(200);

    const get = await GET();
    const body = (await get.json()) as {
      settings: { emailAddress: string; morningTimeKst: string };
    };
    expect(body.settings.emailAddress).toBe("me@example.com");
    expect(body.settings.morningTimeKst).toBe("08:30");
  });
});
