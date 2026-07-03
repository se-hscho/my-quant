import type { ChatAction, ChatCommandResult, ParseChatOptions } from "@/types/agent-chat";
import { parseChatCommand } from "@/lib/agent/chat-commands";
import { ASSET_TYPE_LABELS } from "@/lib/agent/holdings-display";
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

function buildReplyForActions(actions: ChatAction[]): string {
  const parts: string[] = [];
  for (const action of actions) {
    if (action.type === "add_holding") {
      parts.push(
        `${action.ticker} ${action.quantity}을(를) ${ASSET_TYPE_LABELS[action.assetType]}·${action.currency}로 등록했습니다.`
      );
    } else if (action.type === "set_cash") {
      parts.push(
        `${action.field.toUpperCase()} 현금을 ${action.amount.toLocaleString("ko-KR")}으로 반영했습니다.`
      );
    } else if (action.type === "remove_holding") {
      parts.push(`${action.ticker} 종목을 보유에서 제거했습니다.`);
    }
  }
  return `${parts.join(" ")} (참고용)`;
}

function withLlmHint(
  reply: string,
  llmStatus: AgentChatResponse["llmStatus"],
  llmError?: string
): string {
  if (llmStatus === "unconfigured") {
    return `${reply}\n\n💡 자연어 인식은 Preview에 GEMINI_API_KEY 설정 후 재배포가 필요합니다. 지금은 \`SOXX 10주 등록\` 형식을 사용해 주세요.`;
  }
  if (llmStatus === "failed") {
    const detail = llmError ? `\n(원인: ${llmError.slice(0, 120)})` : "";
    return `${reply}\n\n💡 AI 해석에 실패했습니다. 명령 형식으로 다시 입력해 주세요.${detail}`;
  }
  return reply;
}

function successFromLlm(
  result: ChatCommandResult,
  original: string,
  normalized: string | null
): AgentChatResponse {
  const reply =
    normalized && normalized.trim() !== original.trim()
      ? appendNormalizationNote(result, original, normalized)
      : result.reply;
  return {
    ...result,
    normalizedCommand: normalized,
    usedLlm: true,
    llmStatus: "active",
    reply,
  };
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
  if (!llm) {
    return {
      ...direct,
      usedLlm: true,
      llmStatus: "failed",
      reply: withLlmHint(direct.reply, "failed", "empty llm response"),
    };
  }

  if (llm.error && llm.actions.length === 0 && !llm.normalizedCommand) {
    return {
      ...direct,
      usedLlm: true,
      llmStatus: "failed",
      reply: withLlmHint(direct.reply, "failed", llm.error),
    };
  }

  if (llm.actions.length > 0) {
    return successFromLlm(
      { reply: buildReplyForActions(llm.actions), actions: llm.actions },
      message,
      llm.normalizedCommand
    );
  }

  if (llm.normalizedCommand) {
    const fromNormalized = parseChatCommand({
      ...options,
      message: llm.normalizedCommand,
    });
    if (!isUnrecognizedCommand(fromNormalized)) {
      return successFromLlm(fromNormalized, message, llm.normalizedCommand);
    }
  }

  return {
    ...direct,
    normalizedCommand: llm.normalizedCommand,
    usedLlm: true,
    llmStatus: "failed",
    reply: withLlmHint(direct.reply, "failed", llm.error),
  };
}
