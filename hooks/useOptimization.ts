"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { fetchPrices } from "@/lib/yahoo-finance";
import { runOptimization } from "@/lib/optimization";
import { saveResultRemote, saveTempResult } from "@/lib/storage";
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
      // 우선 서버(KV)에 저장 — 공유 링크와 다른 기기 접근의 source of truth.
      // localStorage 저장은 best-effort 캐시이며, 실패(quota 등)해도 KV가 성공하면 흐름은 막지 않는다.
      const [remoteOk, localOk] = await Promise.all([
        saveResultRemote(result),
        Promise.resolve(saveTempResult(result)),
      ]);
      if (!remoteOk && !localOk) {
        throw new Error(
          "결과 저장 실패: 서버 저장과 브라우저 저장이 모두 실패했습니다. 잠시 후 다시 시도해 주세요."
        );
      }
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
