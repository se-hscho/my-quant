import type { Bundle } from "@/types";

const BUNDLES_KEY = "quant:bundles:v1";

function readList(): Bundle[] {
  if (typeof localStorage === "undefined") return [];
  const raw = localStorage.getItem(BUNDLES_KEY);
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw) as Bundle[];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function writeList(list: Bundle[]): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(BUNDLES_KEY, JSON.stringify(list));
  } catch {
    // QuotaExceededError: silently skip — caller shows stale state
  }
}

export function loadCustomBundles(): Bundle[] {
  return readList();
}

export function saveCustomBundle(bundle: Bundle): void {
  const list = readList();
  const idx = list.findIndex((b) => b.id === bundle.id);
  const entry: Bundle = { ...bundle, isCustom: true };
  if (idx >= 0) {
    list[idx] = entry;
  } else {
    list.push(entry);
  }
  writeList(list);
}

/** isCustom: true인 항목만 삭제한다. 기본 번들은 건드리지 않는다. */
export function deleteCustomBundle(id: string): void {
  const list = readList();
  const target = list.find((b) => b.id === id);
  if (!target?.isCustom) return;
  writeList(list.filter((b) => b.id !== id));
}

export function getCustomBundleById(id: string): Bundle | undefined {
  return readList().find((b) => b.id === id);
}
