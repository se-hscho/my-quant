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

  return (
    <ChartWithCaption
      title="현재 자산 비중"
      caption={`총자산 ${Math.round(totalAssetsKrw).toLocaleString("ko-KR")}원 기준 시장가치 비중 (참고용)`}
      interpretation={[
        "종목·현금 비중은 최신 시세로 KRW 환산한 평가액 기준입니다.",
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
