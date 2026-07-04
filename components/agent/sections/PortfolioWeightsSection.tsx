"use client";

import type { Briefing } from "@/services/briefing/types";
import { WeightPieChart } from "@/components/results/WeightPieChart";
import { ChartWithCaption } from "../ChartWithCaption";

export function PortfolioWeightsSection({
  scenarios,
  totalAssetsKrw,
}: {
  scenarios: Briefing["scenarios"];
  totalAssetsKrw: number;
}) {
  const current = scenarios[0]?.weightsBefore ?? {};
  const tickers = Object.keys(current).filter((t) => t !== "CASH");
  const cashPct = current.CASH ?? 0;
  const topTicker = tickers.toSorted((a, b) => (current[b] ?? 0) - (current[a] ?? 0))[0];

  return (
    <ChartWithCaption
      title="현재 자산 비중"
      caption={
        topTicker
          ? `최대 비중 ${topTicker} ${current[topTicker]}% · 현금 ${cashPct}% · 총 ${Math.round(totalAssetsKrw).toLocaleString("ko-KR")}원`
          : `현금 ${cashPct}% · 총 ${Math.round(totalAssetsKrw).toLocaleString("ko-KR")}원`
      }
      help={[
        "종목·현금 비중은 최신 시세 KRW 환산 평가액 기준입니다.",
        "균등 분할이 아니라 실제 보유 규모를 반영합니다.",
      ]}
    >
      {tickers.length === 0 ? (
        <p className="text-sm text-muted-foreground">보유 종목이 없습니다.</p>
      ) : (
        <WeightPieChart weights={current} />
      )}
    </ChartWithCaption>
  );
}
