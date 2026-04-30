import type { PortfolioResult } from "@/types";

const TEMP_PREFIX = "quant:temp:";
const RESULTS_KEY = "quant:results:v1";

export function saveTempResult(result: PortfolioResult): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(`${TEMP_PREFIX}${result.id}`, JSON.stringify(result));
  } catch {
    // 용량 초과 등 무시 — 저장 실패는 saveResult가 사용자에게 표면화한다
  }
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

export type SaveResultStatus = "saved" | "duplicate" | "quota-exceeded" | "error";

export function saveResult(result: PortfolioResult): SaveResultStatus {
  const list = readResultsList();
  if (list.some((r) => r.id === result.id)) return "duplicate";
  list.unshift({ ...result, savedAt: new Date().toISOString() });
  try {
    writeResultsList(list);
    return "saved";
  } catch (err) {
    if (err instanceof Error && /quota/i.test(err.name + err.message)) {
      return "quota-exceeded";
    }
    return "error";
  }
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
