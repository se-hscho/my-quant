"use client";

import { useSyncExternalStore } from "react";
import { hasRegisteredHoldings } from "@/lib/agent/holdings-storage";
import { EmptyHoldingsState } from "./EmptyHoldingsState";
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
    <p className="text-center text-muted-foreground text-sm">
      보유가 등록되었습니다. 브리핑은 다음 Task에서 제공됩니다.
    </p>
  );
}
