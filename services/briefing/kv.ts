import { getKv } from "@/lib/kv";
import type { Briefing } from "./types";

const INDEX_KEY = "agent:briefing:index";
const briefingKey = (date: string) => `agent:briefing:${date}`;

const memoryStore = new Map<string, Briefing>();
let memoryIndex: string[] = [];

function useMemoryFallback(): boolean {
  return (
    process.env.NODE_ENV === "development" ||
    process.env.BRIEFING_DEV_MEMORY === "1" ||
    process.env.VITEST === "true" ||
    !getKv()
  );
}

function saveBriefingToMemory(briefing: Briefing): void {
  memoryStore.set(briefing.date, briefing);
  memoryIndex = [briefing.date, ...memoryIndex.filter((d) => d !== briefing.date)].slice(
    0,
    90
  );
}

export async function saveBriefing(briefing: Briefing): Promise<boolean> {
  const kv = getKv();
  if (kv) {
    await kv.set(briefingKey(briefing.date), briefing);
    const index = ((await kv.get<string[]>(INDEX_KEY)) ?? []).filter(
      (d) => d !== briefing.date
    );
    index.unshift(briefing.date);
    await kv.set(INDEX_KEY, index.slice(0, 90));
    saveBriefingToMemory(briefing);
    return true;
  }
  if (useMemoryFallback()) {
    saveBriefingToMemory(briefing);
    return true;
  }
  return false;
}

export async function getBriefing(date: string): Promise<Briefing | null> {
  const kv = getKv();
  if (kv) {
    const fromKv = await kv.get<Briefing>(briefingKey(date));
    if (fromKv) return fromKv;
  }
  if (useMemoryFallback()) {
    return memoryStore.get(date) ?? null;
  }
  return null;
}

export async function listBriefingDates(): Promise<string[]> {
  const kv = getKv();
  if (kv) {
    const fromKv = (await kv.get<string[]>(INDEX_KEY)) ?? [];
    if (fromKv.length > 0) return fromKv;
  }
  if (useMemoryFallback()) {
    return [...memoryIndex];
  }
  return [];
}

export function clearBriefingMemoryForTests(): void {
  memoryStore.clear();
  memoryIndex = [];
}
