import type { PortfolioResult } from "@/types";

const TEMP_PREFIX = "quant:temp:";
const RESULTS_KEY = "quant:results:v1";

export function saveTempResult(result: PortfolioResult): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(`${TEMP_PREFIX}${result.id}`, JSON.stringify(result));
}

function loadTempResult(id: string): PortfolioResult | null {
  if (typeof localStorage === "undefined") return null;
  const raw = localStorage.getItem(`${TEMP_PREFIX}${id}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PortfolioResult;
  } catch {
    return null;
  }
}

function readResultsList(): PortfolioResult[] {
  if (typeof localStorage === "undefined") return [];
  const raw = localStorage.getItem(RESULTS_KEY);
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw) as PortfolioResult[];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function writeResultsList(list: PortfolioResult[]): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(RESULTS_KEY, JSON.stringify(list));
}

/** quant:results:v1 우선 → quant:temp:[id]. 없으면 null. */
export function loadResult(id: string): PortfolioResult | null {
  const persisted = readResultsList().find((r) => r.id === id);
  if (persisted) return persisted;
  return loadTempResult(id);
}

export function saveResult(result: PortfolioResult): void {
  const list = readResultsList();
  if (list.some((r) => r.id === result.id)) return;
  list.unshift({ ...result, savedAt: new Date().toISOString() });
  writeResultsList(list);
}

export function listResults(): PortfolioResult[] {
  return readResultsList().sort(
    (a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
  );
}

export function clearAllResults(): void {
  if (typeof localStorage === "undefined") return;
  localStorage.removeItem(RESULTS_KEY);
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const key = localStorage.key(i);
    if (key && key.startsWith(TEMP_PREFIX)) localStorage.removeItem(key);
  }
}
