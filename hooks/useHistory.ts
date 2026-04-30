"use client";

import * as React from "react";
import { deleteResult, deleteResultRemote, listResults } from "@/lib/storage";
import type { PortfolioResult } from "@/types";

const MAX_SELECTED = 2;

export interface UseHistoryApi {
  results: PortfolioResult[];
  selected: string[];
  toggle: (id: string) => void;
  remove: (id: string) => void;
  canCompare: boolean;
  refresh: () => void;
}

export function useHistory(): UseHistoryApi {
  const [results, setResults] = React.useState<PortfolioResult[]>([]);
  const [selected, setSelected] = React.useState<string[]>([]);

  const refresh = React.useCallback(() => {
    setResults(listResults());
  }, []);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  const toggle = React.useCallback((id: string) => {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= MAX_SELECTED) return prev;
      return [...prev, id];
    });
  }, []);

  const remove = React.useCallback((id: string) => {
    // 1) 즉시 UI에서 제거 (낙관적 업데이트)
    setResults((prev) => prev.filter((r) => r.id !== id));
    setSelected((prev) => prev.filter((x) => x !== id));
    // 2) 로컬 영구 저장에서 제거
    deleteResult(id);
    // 3) 서버(KV)도 best-effort. 실패해도 사용자 경험은 막지 않는다.
    void deleteResultRemote(id);
  }, []);

  return {
    results,
    selected,
    toggle,
    remove,
    canCompare: selected.length === MAX_SELECTED,
    refresh,
  };
}
