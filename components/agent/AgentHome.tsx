"use client";

import { useSyncExternalStore } from "react";
import { hasRegisteredHoldings, loadHoldingsSnapshot } from "@/lib/agent/holdings-storage";
import { DEMO_PORTFOLIO_SNAPSHOT } from "@/lib/agent/demo-portfolio";
import { BriefingProvider, useBriefing } from "./BriefingProvider";
import { BriefingErrorState } from "./BriefingErrorState";
import { DemoPreviewBanner } from "./DemoPreviewBanner";
import { SummaryPage } from "./SummaryPage";
import { useAgentPersonal } from "./AgentPersonalProvider";
import { Skeleton } from "@/components/ui/skeleton";

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

function AgentHomeInner() {
  const { briefing, loading, error, refresh, isDemo, snapshot } = useBriefing();

  if (loading && !briefing) {
    return (
      <div className="space-y-3" aria-busy="true">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (error || !briefing || !snapshot) {
    return <BriefingErrorState onRetry={() => void refresh()} loading={loading} />;
  }

  return (
    <SummaryPage
      briefing={briefing}
      snapshot={snapshot}
      isDemo={isDemo}
      reportHref={
        isDemo
          ? `/agent/report/${briefing.date}?demo=1`
          : `/agent/report/${briefing.date}`
      }
    />
  );
}

function AgentHomeDemo() {
  return (
    <BriefingProvider snapshotOverride={DEMO_PORTFOLIO_SNAPSHOT} isDemo>
      <div className="space-y-4">
        <DemoPreviewBanner />
        <AgentHomeInner />
      </div>
    </BriefingProvider>
  );
}

function AgentHomeRegistered() {
  return (
    <BriefingProvider>
      <AgentHomeInner />
    </BriefingProvider>
  );
}

export function AgentHome() {
  const { ready } = useAgentPersonal();
  const registered = useSyncExternalStore(
    subscribeHoldings,
    getHoldingsRegistered,
    getServerHoldingsRegistered
  );

  if (!ready) {
    return (
      <div className="space-y-3" aria-busy="true" aria-label="개인 데이터 불러오는 중">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!registered) {
    return <AgentHomeDemo />;
  }

  // 등록됐지만 스냅샷이 비어 있으면 데모 폴백 (손상된 localStorage)
  const snap = loadHoldingsSnapshot();
  if (
    snap &&
    snap.holdings.length === 0 &&
    snap.cash.krw === 0 &&
    snap.cash.usd === 0 &&
    snap.cash.jpy === 0
  ) {
    return <AgentHomeDemo />;
  }

  return <AgentHomeRegistered />;
}
