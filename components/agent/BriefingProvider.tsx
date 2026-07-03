"use client";

import { createContext, use, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import type { HoldingsSnapshot } from "@/types/agent";
import type { Briefing } from "@/services/briefing/types";
import { loadHoldingsSnapshot } from "@/lib/agent/holdings-storage";

interface BriefingProviderProps {
  children: ReactNode;
  /** 미보유 데모 등 — localStorage 대신 고정 스냅샷 사용 */
  snapshotOverride?: HoldingsSnapshot;
  isDemo?: boolean;
}

interface BriefingContextValue {
  briefing: Briefing | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  isDemo: boolean;
  snapshot: HoldingsSnapshot | null;
}

const BriefingContext = createContext<BriefingContextValue | null>(null);

export function useBriefing() {
  const ctx = use(BriefingContext);
  if (!ctx) throw new Error("useBriefing must be used within BriefingProvider");
  return ctx;
}

async function fetchOrGenerate(
  snapshot: HoldingsSnapshot,
  isDemo: boolean
): Promise<Briefing> {
  const demoQuery = isDemo ? "?demo=1" : "";
  const getRes = await fetch(`/api/agent/briefing${demoQuery}`, { cache: "no-store" });
  if (getRes.ok) {
    const data = (await getRes.json()) as { briefing: Briefing | null };
    if (data.briefing?.status === "complete") return data.briefing;
  }
  const postRes = await fetch("/api/agent/briefing", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ snapshot, demo: isDemo }),
  });
  if (!postRes.ok) {
    throw new Error("briefing failed");
  }
  return postRes.json() as Promise<Briefing>;
}

export function BriefingProvider({
  children,
  snapshotOverride,
  isDemo = false,
}: BriefingProviderProps) {
  const [briefing, setBriefing] = useState<Briefing | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<HoldingsSnapshot | null>(
    snapshotOverride ?? null
  );

  const refresh = useCallback(async () => {
    const snap = snapshotOverride ?? loadHoldingsSnapshot();
    setSnapshot(snap);
    if (
      !snap?.holdings.length &&
      !snap?.cash.krw &&
      !snap?.cash.usd &&
      !snap?.cash.jpy
    ) {
      setBriefing(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const b = await fetchOrGenerate(snap, isDemo);
      setBriefing(b);
    } catch {
      setError("브리핑을 생성하지 못했습니다");
      setBriefing(null);
    } finally {
      setLoading(false);
    }
  }, [snapshotOverride, isDemo]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (isDemo || snapshotOverride) return;
    const onUpdate = () => void refresh();
    window.addEventListener("agent-holdings-updated", onUpdate);
    return () => window.removeEventListener("agent-holdings-updated", onUpdate);
  }, [refresh, isDemo, snapshotOverride]);

  const value = useMemo(
    () => ({ briefing, loading, error, refresh, isDemo, snapshot }),
    [briefing, loading, error, refresh, isDemo, snapshot]
  );

  return <BriefingContext value={value}>{children}</BriefingContext>;
}
