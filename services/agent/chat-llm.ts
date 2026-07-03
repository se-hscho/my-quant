import type { ChatAction } from "@/types/agent-chat";
import { parseChatActionsFromLlm } from "@/lib/agent/chat-action-utils";
import { generateGeminiJson } from "@/services/ai/gemini";

const COMMAND_SYSTEM_PROMPT = `당신은 포트폴리오 관리 에이전트의 명령 변환기입니다.
사용자의 자연어(한국어·영어)를 구조화된 명령 JSON으로 변환합니다.
투자 권유·조언은 하지 않습니다.

## actions 규칙
- 종목 등록: { "type":"add_holding", "ticker":"SOXX", "quantity":10, "assetType":"etf", "currency":"USD" }
  - assetType: stock | etf | bond_etf | gold_etf
  - currency: KRW | USD | JPY
  - 한국 주식 티커: 005930.KS, 일본: 7203.T
- 현금: { "type":"set_cash", "field":"krw"|"usd"|"jpy", "amount":50000000 }
- 삭제: { "type":"remove_holding", "ticker":"SOXX" }
- 보유 조회·도움말·일반 질문: actions는 빈 배열 []

## 티커 힌트
- 삼성전자/삼전 → 005930.KS (stock, KRW)
- SK하이닉스/하이닉스 → 000660.KS
- 반도체 ETF/필라델피아 반도체/반도체 etf → SOXX (etf, USD)
- 애플 → AAPL, 엔비디아 → NVDA

## normalizedCommand
actions가 있으면 사람이 읽을 명령 문자열도 함께 넣습니다. 예: "SOXX 10주 등록"

## 출력 JSON (이 스키마만)
{
  "normalizedCommand": string | null,
  "actions": ChatAction[],
  "confidence": "high" | "low"
}`;

export interface LlmNormalizeResult {
  normalizedCommand: string | null;
  actions: ChatAction[];
  confidence?: "high" | "low";
  error?: string;
}

export async function normalizeChatInputWithLlm(
  userMessage: string
): Promise<LlmNormalizeResult | null> {
  const trimmed = userMessage.trim();
  if (!trimmed) return null;

  const result = await generateGeminiJson<{
    normalizedCommand?: string | null;
    actions?: unknown;
    confidence?: "high" | "low";
  }>(COMMAND_SYSTEM_PROMPT, `사용자 입력:\n${trimmed}`);

  if (!result.ok) {
    return {
      normalizedCommand: null,
      actions: [],
      error: result.error,
    };
  }

  const parsed = result.data;
  const actions = parseChatActionsFromLlm(parsed.actions);
  const normalizedCommand =
    typeof parsed.normalizedCommand === "string"
      ? parsed.normalizedCommand.trim() || null
      : null;

  return {
    normalizedCommand,
    actions,
    confidence: parsed.confidence,
  };
}

export { COMMAND_SYSTEM_PROMPT };
