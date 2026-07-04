import type { AssetType, Currency } from "@/types/agent";
import type { ImportedHoldingDraft, HoldingsImportResult } from "@/types/holdings-import";

const ASSET_TYPES = new Set<AssetType>(["stock", "etf", "bond_etf", "gold_etf"]);
const CURRENCIES = new Set<Currency>(["KRW", "USD", "JPY"]);

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

/** 6자리 한국 종목코드를 Yahoo 형식으로 정규화 */
export function normalizeImportedTicker(raw: string): string {
  const trimmed = raw.trim().toUpperCase();
  if (/^\d{6}$/.test(trimmed)) return `${trimmed}.KS`;
  if (/^\d{6}\.KR$/.test(trimmed)) return trimmed.replace(/\.KR$/, ".KS");
  return trimmed;
}

function parseHoldingDraft(raw: unknown): ImportedHoldingDraft | null {
  if (!isRecord(raw)) return null;

  const tickerRaw = typeof raw.ticker === "string" ? raw.ticker : typeof raw.symbol === "string" ? raw.symbol : "";
  const ticker = normalizeImportedTicker(tickerRaw);
  if (!ticker) return null;

  const quantity = Number(raw.quantity ?? raw.qty ?? raw.shares);
  if (!Number.isFinite(quantity) || quantity <= 0) return null;

  const avgCostRaw = raw.avgCost ?? raw.avg_cost ?? raw.purchasePrice ?? raw.cost;
  const avgCost =
    avgCostRaw == null || avgCostRaw === ""
      ? undefined
      : Number(avgCostRaw);
  if (avgCost !== undefined && (!Number.isFinite(avgCost) || avgCost <= 0)) {
    return null;
  }

  const assetType = raw.assetType ?? raw.asset_type ?? "stock";
  if (typeof assetType !== "string" || !ASSET_TYPES.has(assetType as AssetType)) {
    return null;
  }

  const currency = raw.currency ?? inferCurrencyFromTicker(ticker);
  if (typeof currency !== "string" || !CURRENCIES.has(currency as Currency)) {
    return null;
  }

  const name = typeof raw.name === "string" ? raw.name.trim() || undefined : undefined;

  return {
    ticker,
    name,
    quantity,
    avgCost,
    assetType: assetType as AssetType,
    currency: currency as Currency,
  };
}

function inferCurrencyFromTicker(ticker: string): Currency {
  if (ticker.endsWith(".KS") || ticker.endsWith(".KQ")) return "KRW";
  if (ticker.endsWith(".T")) return "JPY";
  return "USD";
}

function parseCash(raw: unknown): HoldingsImportResult["cash"] | undefined {
  if (!isRecord(raw)) return undefined;
  const cash: HoldingsImportResult["cash"] = {};
  for (const field of ["krw", "usd", "jpy"] as const) {
    const value = Number(raw[field]);
    if (Number.isFinite(value) && value >= 0) {
      cash[field] = value;
    }
  }
  return Object.keys(cash).length > 0 ? cash : undefined;
}

/** LLM JSON → 검증된 import 결과. 유효 종목이 없으면 null */
export function parseHoldingsImportFromLlm(raw: unknown): HoldingsImportResult | null {
  if (!isRecord(raw)) return null;

  const holdingsRaw = raw.holdings ?? raw.items ?? raw.positions;
  if (!Array.isArray(holdingsRaw)) return null;

  const holdings: ImportedHoldingDraft[] = [];
  for (const item of holdingsRaw) {
    const parsed = parseHoldingDraft(item);
    if (parsed) holdings.push(parsed);
  }

  if (holdings.length === 0) return null;

  const confidence =
    raw.confidence === "high" || raw.confidence === "low" ? raw.confidence : undefined;
  const notes = typeof raw.notes === "string" ? raw.notes.trim() || undefined : undefined;

  return {
    holdings,
    cash: parseCash(raw.cash),
    confidence,
    notes,
  };
}
