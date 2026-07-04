"use client";

import { useCallback, useEffect, useState } from "react";
import type { HoldingsSnapshot } from "@/types/agent";
import type { ValuationResult } from "@/lib/agent/valuation";
import { loadHoldingsSnapshot } from "@/lib/agent/holdings-storage";

export function usePortfolioValuation(snapshot: HoldingsSnapshot | null) {
  const [valuation, setValuation] = useState<ValuationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const snap = snapshot ?? loadHoldingsSnapshot();
    if (!snap || (snap.holdings.length === 0 && !snap.cash.krw && !snap.cash.usd && !snap.cash.jpy)) {
      setValuation(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/agent/valuation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ snapshot: snap }),
      });
      if (!res.ok) {
        throw new Error("valuation failed");
      }
      const data = (await res.json()) as ValuationResult;
      setValuation(data);
    } catch {
      setError("시세·환율을 불러오지 못했습니다");
      setValuation(null);
    } finally {
      setLoading(false);
    }
  }, [snapshot]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const onUpdate = () => void refresh();
    window.addEventListener("agent-holdings-updated", onUpdate);
    return () => window.removeEventListener("agent-holdings-updated", onUpdate);
  }, [refresh]);

  return { valuation, loading, error, refresh };
}
