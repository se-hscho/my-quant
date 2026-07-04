import type { AssetType, Currency } from "@/types/agent";
import { normalizeImportedTicker } from "@/lib/agent/holdings-import-parse";
import { generateGeminiJson } from "@/services/ai/gemini";

export interface BrokeragePasteRow {
  name: string;
  ticker: string;
  valueKrw: number;
  pnlKrw?: number;
  costKrw?: number;
  returnPct?: number;
  broker?: string;
  quantity: number;
  assetType: AssetType;
  currency: Currency;
}

export interface BrokeragePasteParseResult {
  holdings: BrokeragePasteRow[];
  confidence: "high" | "low";
  notes?: string;
  error?: string;
}

const ASSET_TYPES = new Set<AssetType>(["stock", "etf", "bond_etf", "gold_etf"]);
const CURRENCIES = new Set<Currency>(["KRW", "USD", "JPY"]);

const BROKERAGE_PASTE_PROMPT = `당신은 한국·미국 증권앱 보유 목록 텍스트 파서입니다.
사용자가 붙여넣은 줄 단위 텍스트에서 종목을 추출합니다. 투자 권유는 하지 않습니다.

## 입력 패턴 예
키움증권
아메리칸 타워
6,346,704원
- 2,532,259원(-28.51%)

한두
CREDIT SUISSE HIGH YIEL...
2,691원
• 841원(-23.81%)

## 필드 의미 (중요)
- valueKrw: **현재 평가금액**(원) — "6,346,704원" 줄
- pnlKrw: **평가손익 금액**(원, 손실이면 음수) — "- 2,532,259원" 또는 "• 841원" (손실)
- returnPct: **투자금 대비 수익률** — 괄호 (-28.51%)
- costKrw: 투자원금(원) = valueKrw - pnlKrw (또는 valueKrw/(1+returnPct/100))
- quantity: 앱에 **수량이 명시된 경우만**. 없으면 null (서버가 현재가로 역산)
- ticker: Yahoo Finance 심볼
- assetType: stock | etf | bond_etf | gold_etf
- currency: KRW | USD | JPY

## 규칙
- broker: 키움증권, 한투, 한두 등
- name: 종목 표시명
- bond ETF·하이일드·채권 → bond_etf, 금 ETF → gold_etf
- 미국 종목 currency=USD, 한국 6자리 → 005930.KS currency=KRW

## 출력 JSON
{
  "holdings": [{ "name", "ticker", "valueKrw", "pnlKrw?", "returnPct?", "costKrw?", "broker?", "quantity": number | null, "assetType", "currency" }],
  "confidence": "high" | "low",
  "notes": string | null
}`;

function parseRow(raw: unknown): BrokeragePasteRow | null {
  if (typeof raw !== "object" || raw === null) return null;
  const r = raw as Record<string, unknown>;
  const name = typeof r.name === "string" ? r.name.trim() : "";
  const ticker = normalizeImportedTicker(
    typeof r.ticker === "string" ? r.ticker : ""
  );
  const valueKrw = Number(r.valueKrw);
  if (!name || !ticker || !Number.isFinite(valueKrw) || valueKrw <= 0) return null;

  const quantityRaw = r.quantity;
  const quantity =
    quantityRaw == null || quantityRaw === ""
      ? 1
      : Number(quantityRaw);
  if (!Number.isFinite(quantity) || quantity <= 0) return null;

  const pnlRaw = r.pnlKrw;
  const pnlKrw =
    pnlRaw == null || pnlRaw === "" ? undefined : Number(pnlRaw);

  const costRaw = r.costKrw;
  const costKrw =
    costRaw == null || costRaw === "" ? undefined : Number(costRaw);

  const assetType = (r.assetType ?? "stock") as AssetType;
  const currency = (r.currency ?? "USD") as Currency;
  if (!ASSET_TYPES.has(assetType) || !CURRENCIES.has(currency)) return null;

  const returnPctRaw = r.returnPct;
  let returnPct =
    returnPctRaw == null || returnPctRaw === ""
      ? undefined
      : Number(returnPctRaw);

  if (
    returnPct == null &&
    pnlKrw != null &&
    Number.isFinite(pnlKrw) &&
    valueKrw > 0
  ) {
    const cost = valueKrw - pnlKrw;
    if (cost > 0) returnPct = (pnlKrw / cost) * 100;
  }

  if (
    returnPct == null &&
    costKrw != null &&
    Number.isFinite(costKrw) &&
    costKrw > 0
  ) {
    returnPct = ((valueKrw - costKrw) / costKrw) * 100;
  }

  return {
    name,
    ticker,
    valueKrw: Math.round(valueKrw),
    pnlKrw: pnlKrw != null && Number.isFinite(pnlKrw) ? Math.round(pnlKrw) : undefined,
    costKrw: costKrw != null && Number.isFinite(costKrw) ? Math.round(costKrw) : undefined,
    returnPct: Number.isFinite(returnPct) ? returnPct : undefined,
    broker: typeof r.broker === "string" ? r.broker.trim() : undefined,
    quantity,
    assetType,
    currency,
  };
}

export async function parseBrokeragePasteWithLlm(
  text: string
): Promise<BrokeragePasteParseResult> {
  const result = await generateGeminiJson<{
    holdings?: unknown[];
    confidence?: "high" | "low";
    notes?: string | null;
  }>(BROKERAGE_PASTE_PROMPT, `보유 목록 텍스트:\n${text.trim()}`);

  if (!result.ok) {
    return { holdings: [], confidence: "low", error: result.error };
  }

  const holdings = (result.data.holdings ?? [])
    .map(parseRow)
    .filter((h): h is BrokeragePasteRow => h != null);

  if (holdings.length === 0) {
    return {
      holdings: [],
      confidence: "low",
      error: "종목을 추출하지 못했습니다",
    };
  }

  return {
    holdings,
    confidence: result.data.confidence ?? "low",
    notes: result.data.notes ?? undefined,
  };
}
