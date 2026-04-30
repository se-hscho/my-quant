"use client";

import * as React from "react";
import { listResults } from "@/lib/storage";
import type { PortfolioResult } from "@/types";

const MAX_SELECTED = 2;

export interface UseHistoryApi {
  results: PortfolioResult[];
  selected: string[];
  toggle: (id: string) => void;
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

  return {
    results,
    selected,
    toggle,
    canCompare: selected.length === MAX_SELECTED,
    refresh,
  };
}
