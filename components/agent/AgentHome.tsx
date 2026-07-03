"use client";

import { useSyncExternalStore } from "react";
import { hasRegisteredHoldings, loadHoldingsSnapshot } from "@/lib/agent/holdings-storage";
import { BriefingProvider, useBriefing } from "./BriefingProvider";
import { BriefingErrorState } from "./BriefingErrorState";
import { EmptyHoldingsState } from "./EmptyHoldingsState";
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
  const { briefing, loading, error, refresh } = useBriefing();
  const snapshot = loadHoldingsSnapshot()!;

  if (loading && !briefing) {
    return (
      <div className="space-y-3" aria-busy="true">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (error || !briefing) {
    return <BriefingErrorState onRetry={() => void refresh()} loading={loading} />;
  }

  return <SummaryPage briefing={briefing} snapshot={snapshot} />;
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
    return <EmptyHoldingsState />;
  }

  return (
    <BriefingProvider>
      <AgentHomeInner />
    </BriefingProvider>
  );
}
