import { getKv } from "@/lib/kv";
import type { Briefing } from "./types";

const INDEX_KEY = "agent:briefing:index";
const briefingKey = (date: string) => `agent:briefing:${date}`;

const memoryStore = new Map<string, Briefing>();
let memoryIndex: string[] = [];

function saveBriefingToMemory(briefing: Briefing): void {
  memoryStore.set(briefing.date, briefing);
  memoryIndex = [briefing.date, ...memoryIndex.filter((d) => d !== briefing.date)].slice(
    0,
    90
  );
}

export async function saveBriefing(briefing: Briefing): Promise<boolean> {
  saveBriefingToMemory(briefing);

  const kv = getKv();
  if (!kv) return true;

  try {
    await kv.set(briefingKey(briefing.date), briefing);
    const index = ((await kv.get<string[]>(INDEX_KEY)) ?? []).filter(
      (d) => d !== briefing.date
    );
    index.unshift(briefing.date);
    await kv.set(INDEX_KEY, index.slice(0, 90));
    return true;
  } catch {
    return true;
  }
}

export async function getBriefing(date: string): Promise<Briefing | null> {
  const cached = memoryStore.get(date);
  if (cached) return cached;

  const kv = getKv();
  if (!kv) return null;

  try {
    const fromKv = await kv.get<Briefing>(briefingKey(date));
    if (fromKv) {
      saveBriefingToMemory(fromKv);
      return fromKv;
    }
  } catch {
    return memoryStore.get(date) ?? null;
  }

  return null;
}

export async function listBriefingDates(): Promise<string[]> {
  if (memoryIndex.length > 0) return [...memoryIndex];

  const kv = getKv();
  if (!kv) return [];

  try {
    return (await kv.get<string[]>(INDEX_KEY)) ?? [];
  } catch {
    return [...memoryIndex];
  }
}

export function clearBriefingMemoryForTests(): void {
  memoryStore.clear();
  memoryIndex = [];
}
