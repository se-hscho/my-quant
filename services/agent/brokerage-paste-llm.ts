import type { AssetType, Currency } from "@/types/agent";
import { normalizeImportedTicker } from "@/lib/agent/holdings-import-parse";
import { generateGeminiJson } from "@/services/ai/gemini";

export interface BrokeragePasteRow {
  name: string;
  ticker: string;
  valueKrw: number;
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

## 규칙
- broker: 키움증권, 한투, 한두 등 (있으면)
- name: 종목 표시명
- ticker: Yahoo Finance 심볼 (미국 주식·ETF는 티커, 한국 6자리는 005930.KS, ETF는 069500.KS 등)
- valueKrw: 평가금액(원) 숫자만 — "6,346,704원" → 6346704
- returnPct: 손익률 숫자 (-28.51) — 괄호 안 퍼센트
- quantity: 모르면 1
- assetType: stock | etf | bond_etf | gold_etf
- currency: KRW | USD | JPY (미국 종목은 USD)

## 티커 힌트
- ACE 미국S&P500 → ACE US S&P500 ETF 티커 추론
- KODEX 코스닥150 → 229200.KS etf KRW
- TIGER 리츠부동산인프라 → 한국 ETF 코드 추론
- ISHARES GLOBAL CLEAN → ICLN USD etf
- 제이피모간 체이스 → JPM USD stock
- 코카콜라 → KO
- W&T 오프쇼어 → WTI or appropriate US ticker
- CREDIT SUISSE HIGH YIEL → HY ETF ticker if identifiable

## 출력 JSON
{
  "holdings": [{ "name", "ticker", "valueKrw", "returnPct?", "broker?", "quantity", "assetType", "currency" }],
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

  const quantity = Number(r.quantity ?? 1);
  if (!Number.isFinite(quantity) || quantity <= 0) return null;

  const assetType = (r.assetType ?? "stock") as AssetType;
  const currency = (r.currency ?? "USD") as Currency;
  if (!ASSET_TYPES.has(assetType) || !CURRENCIES.has(currency)) return null;

  const returnPctRaw = r.returnPct;
  const returnPct =
    returnPctRaw == null || returnPctRaw === ""
      ? undefined
      : Number(returnPctRaw);

  return {
    name,
    ticker,
    valueKrw: Math.round(valueKrw),
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
