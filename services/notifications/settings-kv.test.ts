import { describe, expect, it, beforeEach } from "vitest";
import {
  clearNotificationSettingsMemoryForTests,
  defaultNotificationSettings,
  getNotificationSettings,
  saveNotificationSettingsKv,
} from "./settings-kv";

describe("notification settings kv", () => {
  beforeEach(() => {
    clearNotificationSettingsMemoryForTests();
  });

  it("기본값을 반환한다", async () => {
    const s = await getNotificationSettings();
    expect(s.morningTimeKst).toBe("07:00");
    expect(s.emailEnabled).toBe(false);
  });

  it("저장 후 메모리에서 조회한다", async () => {
    await saveNotificationSettingsKv({
      ...defaultNotificationSettings(),
      emailEnabled: true,
      emailAddress: "a@b.com",
    });
    const s = await getNotificationSettings();
    expect(s.emailEnabled).toBe(true);
    expect(s.emailAddress).toBe("a@b.com");
  });
});
