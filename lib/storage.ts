import type { PortfolioResult } from "@/types";

const TEMP_PREFIX = "quant:temp:";
const RESULTS_KEY = "quant:results:v1";

const MAX_TEMP = 5;

export function saveTempResult(result: PortfolioResult): boolean {
  if (typeof localStorage === "undefined") return false;
  // 오래된 temp 결과 정리 (최근 MAX_TEMP개만 유지)
  const tempKeys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k?.startsWith(TEMP_PREFIX)) tempKeys.push(k);
  }
  if (tempKeys.length >= MAX_TEMP) {
    tempKeys.slice(0, tempKeys.length - MAX_TEMP + 1).forEach((k) => localStorage.removeItem(k));
  }
  try {
    localStorage.setItem(`${TEMP_PREFIX}${result.id}`, JSON.stringify(result));
    return true;
  } catch {
    return false;
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

/** quant:results:v1 우선 → quant:temp:[id]. 없으면 null. (로컬 only, sync) */
export function loadResult(id: string): PortfolioResult | null {
  const persisted = readResultsList().find((r) => r.id === id);
  if (persisted) return persisted;
  return loadTempResult(id);
}

/**
 * 로컬에서 먼저 찾고, 없으면 서버(Vercel KV)에서 fetch.
 * 공유 링크(다른 브라우저에서 /results/<id> 열기)를 지원한다.
 */
export async function loadResultRemoteFallback(
  id: string
): Promise<PortfolioResult | null> {
  const local = loadResult(id);
  if (local) return local;
  try {
    const res = await fetch(`/api/results/${encodeURIComponent(id)}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as PortfolioResult;
    // 다음 방문에서 빠르게 보이도록 임시 캐시
    saveTempResult(data);
    return data;
  } catch {
    return null;
  }
}

/**
 * Vercel KV에 결과를 저장 (공유 가능). 실패해도 throw 하지 않는다 — 호출 측은
 * 이미 localStorage에 임시 저장한 상태이며, 서버 저장은 best-effort이다.
 * @returns 성공 시 true, KV 미설정/오류 시 false
 */
export async function saveResultRemote(
  result: PortfolioResult
): Promise<boolean> {
  try {
    const res = await fetch("/api/results", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(result),
    });
    return res.ok;
  } catch {
    return false;
  }
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
