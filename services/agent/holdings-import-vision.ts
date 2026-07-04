import { parseHoldingsImportFromLlm } from "@/lib/agent/holdings-import-parse";
import { generateGeminiJsonWithImage, type GeminiInlineImage } from "@/services/ai/gemini";
import type { HoldingsImportResult } from "@/types/holdings-import";

const IMPORT_SYSTEM_PROMPT = `당신은 증권·투자 앱 스크린샷에서 보유 종목을 추출하는 OCR+구조화 도구입니다.
투자 권유·조언은 하지 않습니다. 화면에 보이는 정보만 추출합니다.

## 추출 대상
- 보유 종목: 티커/종목코드, 종목명(있으면), 보유 수량, 매입단가/평균단가(1주 기준)
- 현금 잔고: KRW·USD·JPY (화면에 표시된 경우만)

## 티커 정규화
- 한국 주식 6자리 코드 → "005930.KS" 형식 (예: 삼성전자 005930 → 005930.KS)
- 미국: AAPL, SOXX, NVDA 등 그대로
- 일본: 7203.T 형식
- ETF/채권ETF/금ETF는 assetType으로 구분

## assetType
stock | etf | bond_etf | gold_etf

## currency
KRW | USD | JPY — 결제/표시 통화 기준

## 규칙
- 화면에 없는 종목을 만들지 마세요
- 수량·매입단가는 숫자만 (쉼표 제거)
- 매입단가가 없으면 avgCost 필드를 생략
- 확신이 낮으면 confidence: "low" 와 notes에 이유
- holdings가 1개 이상이어야 합니다

## 출력 JSON (이 스키마만)
{
  "holdings": [
    {
      "ticker": "005930.KS",
      "name": "삼성전자",
      "quantity": 10,
      "avgCost": 72000,
      "assetType": "stock",
      "currency": "KRW"
    }
  ],
  "cash": { "krw": 0, "usd": 0, "jpy": 0 },
  "confidence": "high" | "low",
  "notes": string | null
}`;

export type HoldingsImportVisionResult =
  | { ok: true; result: HoldingsImportResult; model: string }
  | { ok: false; error: string; code?: "parse_failed" };

export async function extractHoldingsFromScreenshot(
  image: GeminiInlineImage
): Promise<HoldingsImportVisionResult> {
  const llm = await generateGeminiJsonWithImage<unknown>(
    IMPORT_SYSTEM_PROMPT,
    "첨부 스크린샷에서 보유 종목과 현금 잔고를 JSON으로 추출하세요.",
    image
  );

  if (!llm.ok) {
    return { ok: false, error: llm.error };
  }

  const parsed = parseHoldingsImportFromLlm(llm.data);
  if (!parsed) {
    return {
      ok: false,
      error: "스크린샷에서 보유 종목을 찾지 못했습니다. 더 선명한 캡처를 사용해 주세요.",
      code: "parse_failed",
    };
  }

  return { ok: true, result: parsed, model: llm.model };
}

export { IMPORT_SYSTEM_PROMPT };
