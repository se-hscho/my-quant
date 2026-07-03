import { generateGeminiJson } from "@/services/ai/gemini";

const COMMAND_SYSTEM_PROMPT = `당신은 포트폴리오 관리 에이전트의 명령 변환기입니다.
사용자의 자연어(한국어·영어)를 아래 명령 형식 문자열 하나로 변환합니다.
투자 권유·조언은 하지 않고, 명령 형식 변환만 수행합니다.

## 지원 명령 형식 (normalizedCommand에 그대로 사용)

1. 종목 등록: "{TICKER} {수량}주 등록"
   - 유형·통화 옵션: "{TICKER} {수량} etf usd 등록", "{TICKER} {수량} stock krw 등록"
   - 한국 주식: 티커에 .KS 접미사 (예: 005930.KS)
   - 일본 주식: .T 접미사
2. 현금 등록: "{KRW|USD|JPY} 현금 {금액} 등록" (금액: 5000만, 1.2억, 12000 등)
3. 종목 삭제: "{TICKER} 삭제"
4. 보유 조회: "보유 목록 보여줘"
5. 도움말: "도움말"

## 티커 힌트 (사용자가 종목명만 말할 때)
- 삼성전자, 삼전 → 005930.KS
- SK하이닉스, 하이닉스 → 000660.KS
- 반도체 ETF, 필라델피아 반도체 → SOXX
- 애플 → AAPL
- 엔비디아 → NVDA

## 출력 JSON 스키마
{
  "normalizedCommand": string | null,
  "confidence": "high" | "low"
}

- 명령으로 변환 가능하면 normalizedCommand에 위 형식 문자열을 넣습니다.
- 브리핑·시나리오 질문 등 명령이 아니면 normalizedCommand는 null입니다.
- JSON만 출력하세요.`;

export interface LlmNormalizeResult {
  normalizedCommand: string | null;
  confidence?: "high" | "low";
}

export async function normalizeChatInputWithLlm(
  userMessage: string
): Promise<LlmNormalizeResult | null> {
  const trimmed = userMessage.trim();
  if (!trimmed) return null;

  const parsed = await generateGeminiJson<LlmNormalizeResult>(
    COMMAND_SYSTEM_PROMPT,
    `사용자 입력:\n${trimmed}`
  );

  if (!parsed) return null;

  if (parsed.normalizedCommand == null) {
    return { normalizedCommand: null, confidence: parsed.confidence };
  }

  const command = parsed.normalizedCommand.trim();
  if (!command) {
    return { normalizedCommand: null, confidence: parsed.confidence };
  }

  return {
    normalizedCommand: command,
    confidence: parsed.confidence,
  };
}

export { COMMAND_SYSTEM_PROMPT };
