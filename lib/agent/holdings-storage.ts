import type { CashBalances, HoldingsSnapshot } from "@/types/agent";

const HOLDINGS_KEY = "agent:holdings:v1";

export function emptyCash(): CashBalances {
  return { krw: 0, usd: 0, jpy: 0 };
}

export function loadHoldingsSnapshot(): HoldingsSnapshot | null {
  if (typeof localStorage === "undefined") return null;
  const raw = localStorage.getItem(HOLDINGS_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as HoldingsSnapshot;
  } catch {
    return null;
  }
}

export function saveHoldingsSnapshot(snapshot: HoldingsSnapshot): boolean {
  if (typeof localStorage === "undefined") return false;
  try {
    localStorage.setItem(HOLDINGS_KEY, JSON.stringify(snapshot));
    return true;
  } catch {
    return false;
  }
}

export function hasRegisteredHoldings(): boolean {
  const snap = loadHoldingsSnapshot();
  if (!snap) return false;
  if (snap.holdings.length > 0) return true;
  const { krw, usd, jpy } = snap.cash;
  return krw > 0 || usd > 0 || jpy > 0;
}

export function clearHoldings(): void {
  if (typeof localStorage === "undefined") return;
  localStorage.removeItem(HOLDINGS_KEY);
}
