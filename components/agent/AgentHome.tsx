"use client";

import { useSyncExternalStore } from "react";
import { hasRegisteredHoldings } from "@/lib/agent/holdings-storage";
import { EmptyHoldingsState } from "./EmptyHoldingsState";

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
  const registered = useSyncExternalStore(
    subscribeHoldings,
    getHoldingsRegistered,
    getServerHoldingsRegistered
  );

  if (!registered) {
    return <EmptyHoldingsState />;
  }

  return (
    <p className="text-center text-muted-foreground text-sm">
      보유가 등록되었습니다. 브리핑은 다음 Task에서 제공됩니다.
    </p>
  );
}
