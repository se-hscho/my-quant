import type { ChatAction } from "@/types/agent-chat";
import type { AssetType, Currency } from "@/types/agent";

const ASSET_TYPES = new Set<AssetType>(["stock", "etf", "bond_etf", "gold_etf"]);
const CURRENCIES = new Set<Currency>(["KRW", "USD", "JPY"]);
const CASH_FIELDS = new Set(["krw", "usd", "jpy"] as const);

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function parseAddHolding(raw: Record<string, unknown>): ChatAction | null {
  const ticker = typeof raw.ticker === "string" ? raw.ticker.trim().toUpperCase() : "";
  const quantity = Number(raw.quantity);
  const assetType = raw.assetType;
  const currency = raw.currency;
  if (!ticker || !Number.isFinite(quantity) || quantity <= 0) return null;
  if (typeof assetType !== "string" || !ASSET_TYPES.has(assetType as AssetType)) return null;
  if (typeof currency !== "string" || !CURRENCIES.has(currency as Currency)) return null;
  return {
    type: "add_holding",
    ticker,
    quantity,
    assetType: assetType as AssetType,
    currency: currency as Currency,
  };
}

function parseSetCash(raw: Record<string, unknown>): ChatAction | null {
  const field = raw.field;
  const amount = Number(raw.amount);
  if (typeof field !== "string" || !CASH_FIELDS.has(field as "krw" | "usd" | "jpy")) return null;
  if (!Number.isFinite(amount) || amount < 0) return null;
  return { type: "set_cash", field: field as "krw" | "usd" | "jpy", amount };
}

function parseRemoveHolding(raw: Record<string, unknown>): ChatAction | null {
  const ticker = typeof raw.ticker === "string" ? raw.ticker.trim().toUpperCase() : "";
  if (!ticker) return null;
  return { type: "remove_holding", ticker };
}

export function parseChatActionsFromLlm(raw: unknown): ChatAction[] {
  if (!Array.isArray(raw)) return [];
  const actions: ChatAction[] = [];
  for (const item of raw) {
    if (!isRecord(item) || typeof item.type !== "string") continue;
    let parsed: ChatAction | null = null;
    if (item.type === "add_holding") parsed = parseAddHolding(item);
    else if (item.type === "set_cash") parsed = parseSetCash(item);
    else if (item.type === "remove_holding") parsed = parseRemoveHolding(item);
    if (parsed) actions.push(parsed);
  }
  return actions;
}
