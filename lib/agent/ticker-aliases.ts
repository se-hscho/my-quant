/** 자연어 별칭 → 티커 (LLM 없이 규칙 파서 보강) */
const TICKER_ALIASES: Array<{ pattern: RegExp; ticker: string }> = [
  { pattern: /필라델피아\s*반도체(?:\s*etf)?/i, ticker: "SOXX" },
  { pattern: /반도체\s*etf/i, ticker: "SOXX" },
  { pattern: /반도체\s*(?:주식|종목)?/i, ticker: "SOXX" },
  { pattern: /삼성전자|삼전/i, ticker: "005930.KS" },
  { pattern: /SK\s*하이닉스|하이닉스/i, ticker: "000660.KS" },
  { pattern: /애플/i, ticker: "AAPL" },
  { pattern: /엔비디아/i, ticker: "NVDA" },
  { pattern: /테슬라/i, ticker: "TSLA" },
  { pattern: /나스닥\s*100|나스닥100/i, ticker: "QQQ" },
  { pattern: /금\s*etf|골드\s*etf/i, ticker: "GLD" },
];

const PURCHASE_VERBS = /(샀어|샀다|구매했어|구매|매수|장만|산\s*거)/g;

/** 자연어 구매 표현을 규칙 파서가 읽을 수 있는 형태로 정규화 */
export function normalizeNaturalLanguageCommand(message: string): string {
  let text = message.trim();
  if (!text) return text;

  text = text.replace(PURCHASE_VERBS, "등록");

  for (const { pattern, ticker } of TICKER_ALIASES) {
    if (pattern.test(text)) {
      text = text.replace(pattern, ticker);
      break;
    }
  }

  if (!/(등록|추가|넣어|설정|업데이트|변경|삭제|제거)/.test(text)) {
    if (/\d+\s*(?:주|개|shares?)/i.test(text)) {
      text = `${text} 등록`;
    }
  }

  return text.replace(/\s+/g, " ").trim();
}
