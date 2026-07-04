import type { HoldingsSnapshot } from "@/types/agent";

/** 미보유 사용자에게 기능을 체험시키는 예시 포트폴리오 (실시세·FX로 브리핑 생성) */
export const DEMO_PORTFOLIO_SNAPSHOT: HoldingsSnapshot = {
  holdings: [
    {
      id: "demo-samsung",
      ticker: "005930.KS",
      quantity: 20,
      avgCost: 72_000,
      assetType: "stock",
      currency: "KRW",
      sector: "semiconductor",
      region: "KR",
    },
    {
      id: "demo-soxx",
      ticker: "SOXX",
      quantity: 12,
      avgCost: 220,
      assetType: "etf",
      currency: "USD",
      sector: "semiconductor",
      region: "US",
    },
    {
      id: "demo-kodex",
      ticker: "069500.KS",
      quantity: 25,
      avgCost: 38_000,
      assetType: "etf",
      currency: "KRW",
      sector: "broad_market",
      region: "KR",
    },
  ],
  cash: { krw: 8_000_000, usd: 3_500, jpy: 0 },
  updatedAt: new Date().toISOString(),
};

export function isDemoPortfolioSnapshot(snapshot: HoldingsSnapshot): boolean {
  return snapshot.holdings.every((h) => h.id.startsWith("demo-"));
}

export function resolveBriefingDate(date: string): string {
  if (date === "today") return new Date().toISOString().slice(0, 10);
  return date;
}
