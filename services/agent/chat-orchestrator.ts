import type { ChatCommandResult, ParseChatOptions } from "@/types/agent-chat";
import { parseChatCommand } from "@/lib/agent/chat-commands";
import { isGeminiConfigured } from "@/services/ai/gemini";
import { normalizeChatInputWithLlm } from "@/services/agent/chat-llm";

export interface AgentChatResponse extends ChatCommandResult {
  normalizedCommand?: string | null;
  usedLlm?: boolean;
  llmStatus?: "active" | "unconfigured" | "failed" | "skipped";
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

function withLlmHint(reply: string, llmStatus: AgentChatResponse["llmStatus"]): string {
  if (llmStatus === "unconfigured") {
    return `${reply}\n\n💡 자연어 인식은 Preview에 GEMINI_API_KEY 설정 후 재배포가 필요합니다. 지금은 \`SOXX 10주 등록\` 형식을 사용해 주세요.`;
  }
  if (llmStatus === "failed") {
    return `${reply}\n\n💡 AI 해석에 실패했습니다. 명령 형식으로 다시 입력해 주세요.`;
  }
  return reply;
}

export async function processAgentChat(
  options: ParseChatOptions
): Promise<AgentChatResponse> {
  const message = options.message.trim();
  if (!message) {
    return { reply: "질문을 입력해 주세요.", actions: [], llmStatus: "skipped" };
  }

  const direct = parseChatCommand(options);
  if (!isUnrecognizedCommand(direct)) {
    return { ...direct, llmStatus: "skipped" };
  }

  if (!isGeminiConfigured()) {
    return {
      ...direct,
      llmStatus: "unconfigured",
      reply: withLlmHint(direct.reply, "unconfigured"),
    };
  }

  const llm = await normalizeChatInputWithLlm(message);
  if (!llm?.normalizedCommand) {
    return {
      ...direct,
      usedLlm: true,
      llmStatus: "failed",
      reply: withLlmHint(direct.reply, "failed"),
    };
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
      llmStatus: "active",
      reply: appendNormalizationNote(fromNormalized, message, normalized),
    };
  }

  return {
    ...direct,
    normalizedCommand: normalized,
    usedLlm: true,
    llmStatus: "failed",
    reply: withLlmHint(direct.reply, "failed"),
  };
}
