import type { ChatCommandResult, ParseChatOptions } from "@/types/agent-chat";
import { parseChatCommand } from "@/lib/agent/chat-commands";
import { isGeminiConfigured } from "@/services/ai/gemini";
import { normalizeChatInputWithLlm } from "@/services/agent/chat-llm";

export interface AgentChatResponse extends ChatCommandResult {
  /** LLM이 변환한 명령 문자열 (원문과 다를 때만) */
  normalizedCommand?: string | null;
  /** LLM 정규화 사용 여부 */
  usedLlm?: boolean;
}

function isUnrecognizedCommand(result: ChatCommandResult): boolean {
  return (
    result.actions.length === 0 &&
    result.reply.includes("명령을 이해하지 못했습니다")
  );
}

function appendNormalizationNote(
  result: ChatCommandResult,
  original: string,
  normalized: string
): string {
  if (original.trim() === normalized.trim()) {
    return result.reply;
  }
  return `${result.reply}\n\n📝 입력 해석: \`${normalized}\``;
}

export async function processAgentChat(
  options: ParseChatOptions
): Promise<AgentChatResponse> {
  const message = options.message.trim();
  if (!message) {
    return { reply: "질문을 입력해 주세요.", actions: [] };
  }

  const direct = parseChatCommand(options);
  if (!isUnrecognizedCommand(direct)) {
    return direct;
  }

  if (!isGeminiConfigured()) {
    return direct;
  }

  const llm = await normalizeChatInputWithLlm(message);
  if (!llm?.normalizedCommand) {
    return { ...direct, usedLlm: true };
  }

  const normalized = llm.normalizedCommand;
  const fromNormalized = parseChatCommand({
    ...options,
    message: normalized,
  });

  if (!isUnrecognizedCommand(fromNormalized)) {
    return {
      ...fromNormalized,
      normalizedCommand: normalized,
      usedLlm: true,
      reply: appendNormalizationNote(fromNormalized, message, normalized),
    };
  }

  return { ...direct, normalizedCommand: normalized, usedLlm: true };
}
