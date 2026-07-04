import { getKv } from "@/lib/kv";
import type { NotificationSettings } from "@/types/agent-settings";

const SETTINGS_KEY = "agent:settings:notifications";

let memorySettings: NotificationSettings | null = null;

export function defaultNotificationSettings(): NotificationSettings {
  return {
    emailEnabled: false,
    emailAddress: "",
    slackEnabled: false,
    slackWebhookUrl: "",
    morningTimeKst: "07:00",
  };
}

export async function getNotificationSettings(): Promise<NotificationSettings> {
  if (memorySettings) return { ...memorySettings };

  const kv = getKv();
  if (kv) {
    try {
      const stored = await kv.get<NotificationSettings>(SETTINGS_KEY);
      if (stored) {
        memorySettings = { ...defaultNotificationSettings(), ...stored };
        return { ...memorySettings };
      }
    } catch {
      /* fall through */
    }
  }

  return defaultNotificationSettings();
}

export async function saveNotificationSettingsKv(
  settings: NotificationSettings
): Promise<boolean> {
  memorySettings = { ...defaultNotificationSettings(), ...settings };

  const kv = getKv();
  if (!kv) return true;

  try {
    await kv.set(SETTINGS_KEY, memorySettings);
    return true;
  } catch {
    return true;
  }
}

export function clearNotificationSettingsMemoryForTests(): void {
  memorySettings = null;
}
