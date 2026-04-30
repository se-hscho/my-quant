"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { fetchPrices } from "@/lib/yahoo-finance";
import { runOptimization } from "@/lib/optimization";
import { saveTempResult } from "@/lib/storage";
import type {
  OptimizationMethod,
  PortfolioResult,
} from "@/types";

export type OptimizationStatus =
  | "idle"
  | "fetching"
  | "computing"
  | "done"
  | "error";

export interface UseOptimizationArgs {
  bundleId: string;
  bundleName: string;
  method: OptimizationMethod;
  tickers: string[];
  range?: string;
  /** push 대신 호출되는 콜백 (테스트용). 미지정 시 router.push 사용. */
  onComplete?: (id: string) => void;
}

export interface UseOptimizationApi {
  run: () => void;
  status: OptimizationStatus;
  message: string;
  error: string | null;
  retry: () => void;
}

const STEP_MESSAGES: Record<OptimizationStatus, string> = {
  idle: "",
  fetching: "데이터 가져오는 중...",
  computing: "계산 중...",
  done: "결과 준비 중...",
  error: "",
};

export function useOptimization(args: UseOptimizationArgs): UseOptimizationApi {
  const router = useRouter();
  const [status, setStatus] = React.useState<OptimizationStatus>("idle");
  const [error, setError] = React.useState<string | null>(null);
  const argsRef = React.useRef(args);
  React.useLayoutEffect(() => {
    argsRef.current = args;
  });

  const execute = React.useCallback(async () => {
    const { bundleId, bundleName, method, tickers, range = "10y", onComplete } =
      argsRef.current;
    setError(null);
    setStatus("fetching");

    try {
      const series = await Promise.all(
        tickers.map((t) => fetchPrices(t, range))
      );
      const pricesByTicker: Record<string, number[]> = {};
      for (let i = 0; i < tickers.length; i++) {
        pricesByTicker[tickers[i]] = series[i].closes;
      }
      setStatus("computing");
      // Yield to allow UI to paint "계산 중..." before heavy synchronous work.
      await new Promise((r) => setTimeout(r, 0));

      const { optimal, frontier, metrics } = runOptimization(
        pricesByTicker,
        method
      );

      const id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `r_${Date.now()}_${Math.random().toString(36).slice(2)}`;

      const result: PortfolioResult = {
        id,
        bundleId,
        bundleName,
        method,
        tickers,
        weights: optimal.weights ?? {},
        metrics,
        frontier,
        savedAt: new Date().toISOString(),
      };
      saveTempResult(result);
      setStatus("done");

      if (onComplete) onComplete(id);
      else router.push(`/results/${id}`);
    } catch (e) {
      setStatus("error");
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [router]);

  return {
    run: execute,
    retry: execute,
    status,
    message: STEP_MESSAGES[status],
    error,
  };
}
