import { describe, expect, it } from "vitest";
import {
  defaultNotificationSettings,
  loadNotificationSettings,
  saveNotificationSettings,
} from "./settings-storage";

describe("settings-storage", () => {
  it("저장 후 다시 로드하면 값이 유지된다", () => {
    const settings = {
      ...defaultNotificationSettings(),
      emailEnabled: true,
      emailAddress: "test@example.com",
      morningTimeKst: "08:00",
    };
    expect(saveNotificationSettings(settings)).toBe(true);
    expect(loadNotificationSettings()).toMatchObject({
      emailEnabled: true,
      emailAddress: "test@example.com",
      morningTimeKst: "08:00",
    });
  });
});
