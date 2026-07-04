import type { HoldingsSnapshot } from "@/types/agent";

/** 보유 종목 없이 현금만 등록된 상태 (신규 배분 모드) */
export function isCashOnlySnapshot(snapshot: HoldingsSnapshot): boolean {
  if (snapshot.holdings.length > 0) return false;
  const { krw, usd, jpy } = snapshot.cash;
  return krw > 0 || usd > 0 || jpy > 0;
}

export function preferKrMarket(snapshot: HoldingsSnapshot): boolean {
  if (snapshot.holdings.length > 0) {
    const kr = snapshot.holdings.filter(
      (h) => h.region === "KR" || h.ticker.endsWith(".KS")
    ).length;
    return kr >= snapshot.holdings.length / 2;
  }
  return snapshot.cash.krw >= snapshot.cash.usd * 1000;
}
