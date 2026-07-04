"use client";

import type { HoldingsSnapshot } from "@/types/agent";
import {
  ASSET_TYPE_LABELS,
  CURRENCY_LABELS,
  formatCashAmount,
  formatQuantity,
} from "@/lib/agent/holdings-display";
import { AGENT_SECTOR_LABELS, type AgentSectorId } from "@/config/agent";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PortfolioValueCard } from "./PortfolioValueCard";
import { usePortfolioValuation } from "@/hooks/usePortfolioValuation";

export interface HoldingsListProps {
  snapshot: HoldingsSnapshot;
}

export function HoldingsList({ snapshot }: HoldingsListProps) {
  const { valuation, loading, error, refresh } = usePortfolioValuation(snapshot);

  return (
    <div className="space-y-4">
      <PortfolioValueCard
        valuation={valuation}
        loading={loading}
        error={error}
        onRefresh={() => void refresh()}
      />
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">통화별 현금</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-1">
          <p>KRW {formatCashAmount("KRW", snapshot.cash.krw)}</p>
          <p>USD {formatCashAmount("USD", snapshot.cash.usd)}</p>
          <p>JPY {formatCashAmount("JPY", snapshot.cash.jpy)}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">보유 종목</CardTitle>
        </CardHeader>
        <CardContent>
          {snapshot.holdings.length === 0 ? (
            <p className="text-sm text-muted-foreground">등록된 종목이 없습니다.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-2 pr-2 font-medium">티커</th>
                    <th className="py-2 pr-2 font-medium">수량</th>
                    <th className="py-2 pr-2 font-medium">유형</th>
                    <th className="py-2 pr-2 font-medium">섹터</th>
                    <th className="py-2 font-medium">통화</th>
                  </tr>
                </thead>
                <tbody>
                  {snapshot.holdings.map((h) => (
                    <tr key={h.id} className="border-b last:border-0">
                      <td className="py-2 pr-2">{h.ticker}</td>
                      <td className="py-2 pr-2">{formatQuantity(h.quantity)}</td>
                      <td className="py-2 pr-2">{ASSET_TYPE_LABELS[h.assetType]}</td>
                      <td className="py-2 pr-2">
                        {h.sector
                          ? AGENT_SECTOR_LABELS[h.sector as AgentSectorId] ?? h.sector
                          : "—"}
                      </td>
                      <td className="py-2">{CURRENCY_LABELS[h.currency]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
