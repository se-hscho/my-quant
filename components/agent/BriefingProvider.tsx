"use client";

import { createContext, use, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import type { HoldingsSnapshot } from "@/types/agent";
import type { Briefing } from "@/services/briefing/types";
import type { BriefingErrorInfo } from "@/types/agent-briefing";
import { BriefingFetchError } from "@/types/agent-briefing";
import { fetchOrGenerateBriefing } from "@/lib/agent/briefing-fetch";
import { loadHoldingsSnapshot } from "@/lib/agent/holdings-storage";

interface BriefingProviderProps {
  children: ReactNode;
  snapshotOverride?: HoldingsSnapshot;
  isDemo?: boolean;
}

interface BriefingContextValue {
  briefing: Briefing | null;
  loading: boolean;
  error: BriefingErrorInfo | null;
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

export function BriefingProvider({
  children,
  snapshotOverride,
  isDemo = false,
}: BriefingProviderProps) {
  const [briefing, setBriefing] = useState<Briefing | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<BriefingErrorInfo | null>(null);
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
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const b = await fetchOrGenerateBriefing(snap, isDemo);
      setBriefing(b);
    } catch (e) {
      setBriefing(null);
      if (e instanceof BriefingFetchError) {
        setError(e.info);
      } else {
        setError({
          code: "UNKNOWN",
          message: e instanceof Error ? e.message : "브리핑을 생성하지 못했습니다",
        });
      }
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
