"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { hasRegisteredHoldings, loadHoldingsSnapshot } from "@/lib/agent/holdings-storage";
import { buildLocalBriefingSummary } from "@/services/briefing/summary-local";
import { usePortfolioValuation } from "@/hooks/usePortfolioValuation";
import { EmptyHoldingsState } from "./EmptyHoldingsState";
import { PortfolioValueCard, PortfolioCashRow } from "./PortfolioValueCard";
import { useAgentPersonal } from "./AgentPersonalProvider";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function subscribeHoldings(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener("agent-holdings-updated", onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener("agent-holdings-updated", onStoreChange);
  };
}

function getHoldingsRegistered() {
  return hasRegisteredHoldings();
}

function getServerHoldingsRegistered() {
  return false;
}

export function AgentHome() {
  const { ready } = useAgentPersonal();
  const registered = useSyncExternalStore(
    subscribeHoldings,
    getHoldingsRegistered,
    getServerHoldingsRegistered
  );
  const snapshot = registered ? loadHoldingsSnapshot() : null;
  const { valuation, loading, error, refresh } = usePortfolioValuation(snapshot);

  if (!ready) {
    return (
      <div className="space-y-3" aria-busy="true" aria-label="개인 데이터 불러오는 중">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!registered || !snapshot) {
    return <EmptyHoldingsState />;
  }

  const briefing = buildLocalBriefingSummary(
    snapshot,
    valuation?.totalKrw ?? 0,
    valuation?.holdings
  );

  return (
    <div className="space-y-4">
      <PortfolioValueCard
        valuation={valuation}
        loading={loading}
        error={error}
        onRefresh={() => void refresh()}
      />
      <PortfolioCashRow
        krw={snapshot.cash.krw}
        usd={snapshot.cash.usd}
        jpy={snapshot.cash.jpy}
      />

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">오늘 포트폴리오 요약</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <ul className="list-disc space-y-1 pl-4">
            {briefing.lines.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          {briefing.sectorTop3.length > 0 ? (
            <p className="text-xs text-muted-foreground">
              섹터 비중:{" "}
              {briefing.sectorTop3
                .map((s) => `${s.label} ${s.weightPct}%`)
                .join(" · ")}
            </p>
          ) : null}
          <p className="text-[10px] text-muted-foreground">{briefing.disclaimer}</p>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" asChild>
          <Link href="/agent/holdings">보유 편집</Link>
        </Button>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        하단 채팅에 <strong>삼전 10주</strong>, <strong>반도체 etf 10주 샀어</strong>처럼 입력해 보세요.
        자주 쓰는 표현은 AI 없이 바로 처리됩니다.
      </p>
    </div>
  );
}
