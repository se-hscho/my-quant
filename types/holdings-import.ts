import type { AssetType, CashBalances, Currency } from "@/types/agent";

/** Vision LLM이 추출한 보유 종목 초안 (저장 전) */
export interface ImportedHoldingDraft {
  ticker: string;
  name?: string;
  quantity: number;
  avgCost?: number;
  assetType: AssetType;
  currency: Currency;
}

export interface HoldingsImportResult {
  holdings: ImportedHoldingDraft[];
  cash?: Partial<CashBalances>;
  confidence?: "high" | "low";
  notes?: string;
}

export interface HoldingsImportApiResponse {
  ok: true;
  result: HoldingsImportResult;
  model?: string;
}

export interface HoldingsImportApiError {
  ok: false;
  error: string;
  code?: "unconfigured" | "rate_limited" | "invalid_image" | "parse_failed";
}
