"use client";

import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AgentPersonalData } from "@/types/agent-personal";
import { hydratePersonalData } from "@/lib/agent/personal-sync";

interface AgentPersonalContextValue {
  ready: boolean;
  data: AgentPersonalData | null;
  refresh: () => Promise<void>;
}

const AgentPersonalContext = createContext<AgentPersonalContextValue | null>(null);

export function useAgentPersonal() {
  const ctx = use(AgentPersonalContext);
  if (!ctx) {
    throw new Error("useAgentPersonal must be used within AgentPersonalProvider");
  }
  return ctx;
}

export function AgentPersonalProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [data, setData] = useState<AgentPersonalData | null>(null);

  const refresh = useCallback(async () => {
    const merged = await hydratePersonalData();
    setData(merged);
    setReady(true);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({ ready, data, refresh }),
    [ready, data, refresh]
  );

  return (
    <AgentPersonalContext value={value}>{children}</AgentPersonalContext>
  );
}
