import { getKv } from "@/lib/kv";

const sentKey = (date: string) => `agent:notifications:morning:${date}`;
const memorySent = new Set<string>();

export async function hasMorningNotificationSent(date: string): Promise<boolean> {
  if (memorySent.has(date)) return true;

  const kv = getKv();
  if (!kv) return false;

  try {
    const sent = await kv.get<boolean>(sentKey(date));
    if (sent) {
      memorySent.add(date);
      return true;
    }
  } catch {
    return memorySent.has(date);
  }

  return false;
}

export async function markMorningNotificationSent(date: string): Promise<void> {
  memorySent.add(date);

  const kv = getKv();
  if (!kv) return;

  try {
    await kv.set(sentKey(date), true, { ex: 60 * 60 * 48 });
  } catch {
    /* memory flag only */
  }
}

export function clearMorningNotificationMemoryForTests(): void {
  memorySent.clear();
}
