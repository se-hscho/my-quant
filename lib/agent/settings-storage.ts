import type { NotificationSettings } from "@/types/agent-settings";

export type { NotificationSettings };

const SETTINGS_KEY = "agent:settings:v1";

export function defaultNotificationSettings(): NotificationSettings {
  return {
    emailEnabled: false,
    emailAddress: "",
    slackEnabled: false,
    slackWebhookUrl: "",
    morningTimeKst: "07:00",
  };
}

export function loadNotificationSettings(): NotificationSettings {
  if (typeof localStorage === "undefined") return defaultNotificationSettings();
  const raw = localStorage.getItem(SETTINGS_KEY);
  if (!raw) return defaultNotificationSettings();
  try {
    return { ...defaultNotificationSettings(), ...JSON.parse(raw) };
  } catch {
    return defaultNotificationSettings();
  }
}

export function saveNotificationSettings(settings: NotificationSettings): boolean {
  if (typeof localStorage === "undefined") return false;
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    return true;
  } catch {
    return false;
  }
}
