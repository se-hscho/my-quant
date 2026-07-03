"use client";

import { createContext, use, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import type { HoldingsSnapshot } from "@/types/agent";
import type { Briefing } from "@/services/briefing/types";
import { loadHoldingsSnapshot } from "@/lib/agent/holdings-storage";

interface BriefingContextValue {
  briefing: Briefing | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const BriefingContext = createContext<BriefingContextValue | null>(null);

export function useBriefing() {
  const ctx = use(BriefingContext);
  if (!ctx) throw new Error("useBriefing must be used within BriefingProvider");
  return ctx;
}

async function fetchOrGenerate(snapshot: HoldingsSnapshot): Promise<Briefing> {
  const getRes = await fetch("/api/agent/briefing", { cache: "no-store" });
  if (getRes.ok) {
    const data = (await getRes.json()) as { briefing: Briefing | null };
    if (data.briefing?.status === "complete") return data.briefing;
  }
  const postRes = await fetch("/api/agent/briefing", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ snapshot }),
  });
  if (!postRes.ok) {
    throw new Error("briefing failed");
  }
  return postRes.json() as Promise<Briefing>;
}

export function BriefingProvider({ children }: { children: ReactNode }) {
  const [briefing, setBriefing] = useState<Briefing | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const snap = loadHoldingsSnapshot();
    if (!snap?.holdings.length && !snap?.cash.krw && !snap?.cash.usd && !snap?.cash.jpy) {
      setBriefing(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const b = await fetchOrGenerate(snap);
      setBriefing(b);
    } catch {
      setError("브리핑을 생성하지 못했습니다");
      setBriefing(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const onUpdate = () => void refresh();
    window.addEventListener("agent-holdings-updated", onUpdate);
    return () => window.removeEventListener("agent-holdings-updated", onUpdate);
  }, [refresh]);

  const value = useMemo(
    () => ({ briefing, loading, error, refresh }),
    [briefing, loading, error, refresh]
  );

  return <BriefingContext value={value}>{children}</BriefingContext>;
}
