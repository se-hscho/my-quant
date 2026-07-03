import type { ChatAction, ChatCommandResult, ParseChatOptions } from "@/types/agent-chat";
import { isReadOnlyChatMessage, parseChatCommand } from "@/lib/agent/chat-commands";
import { ASSET_TYPE_LABELS } from "@/lib/agent/holdings-display";
import {
  GEMINI_DEFAULT_MODEL,
  isBlockedGeminiModel,
  isGeminiConfigured,
} from "@/services/ai/gemini";
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

function buildLlmFailureHint(llmError?: string): string {
  const detail = llmError ? `\n(원인: ${llmError.slice(0, 320)})` : "";
  const envModel = process.env.GEMINI_MODEL?.trim();
  const modelLines: string[] = [];

  if (envModel && isBlockedGeminiModel(envModel)) {
    modelLines.push(
      `· Vercel의 GEMINI_MODEL=${envModel} 은(는) 더 이상 지원되지 않습니다. 변수를 삭제하거나 ${GEMINI_DEFAULT_MODEL} 로 변경 후 재배포하세요.`
    );
  }

  if (/API key not valid|forbidden|GEMINI_API_KEY not configured/i.test(llmError ?? "")) {
    modelLines.push(
      "· GEMINI_API_KEY는 Google AI Studio(https://aistudio.google.com/apikey)에서 발급한 키여야 합니다."
    );
  }

  return `${detail}\n\n💡 AI 해석에 실패했습니다.\n${modelLines.join("\n")}\n· Preview에서 /api/agent/chat/status 를 열어 modelsList·probe·hints 를 확인하세요.`;
}

function withLlmHint(
  reply: string,
  llmStatus: AgentChatResponse["llmStatus"],
  llmError?: string
): string {
  if (llmStatus === "unconfigured") {
    return `${reply}\n\n💡 자연어 등록은 Preview에 GEMINI_API_KEY 설정 후 재배포가 필요합니다. 지금은 \`SOXX 10주 등록\` 형식을 사용해 주세요.`;
  }
  if (llmStatus === "failed") {
    return `${reply}${buildLlmFailureHint(llmError)}`;
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

async function tryLlmMutation(
  message: string
): Promise<{ response: AgentChatResponse; error?: string }> {
  const llm = await normalizeChatInputWithLlm(message);
  if (!llm) {
    return {
      error: "empty llm response",
      response: {
        reply: "명령을 이해하지 못했습니다. (참고용)",
        actions: [],
        usedLlm: true,
        llmStatus: "failed",
      },
    };
  }

  if (llm.actions.length > 0) {
    return {
      response: successFromLlm(
        { reply: buildReplyForActions(llm.actions), actions: llm.actions },
        message,
        llm.normalizedCommand
      ),
    };
  }

  const error = llm.error ?? "no actions in llm response";
  return {
    error,
    response: {
      reply: "명령을 이해하지 못했습니다. (참고용)",
      actions: [],
      normalizedCommand: llm.normalizedCommand,
      usedLlm: true,
      llmStatus: "failed",
    },
  };
}

export async function processAgentChat(
  options: ParseChatOptions
): Promise<AgentChatResponse> {
  const message = options.message.trim();
  if (!message) {
    return { reply: "질문을 입력해 주세요.", actions: [], llmStatus: "skipped" };
  }

  if (isReadOnlyChatMessage(message)) {
    return { ...parseChatCommand(options), llmStatus: "skipped" };
  }

  if (isGeminiConfigured()) {
    const { response: llmResult, error: llmError } = await tryLlmMutation(message);
    if (llmResult.llmStatus === "active") {
      return llmResult;
    }

    const fallback = parseChatCommand(options);
    if (!isUnrecognizedCommand(fallback)) {
      return {
        ...fallback,
        llmStatus: "failed",
        reply: `${fallback.reply}\n\n💡 AI 해석은 실패했지만 기본 명령 형식으로 처리했습니다.`,
      };
    }

    return {
      ...fallback,
      normalizedCommand: llmResult.normalizedCommand,
      usedLlm: true,
      llmStatus: "failed",
      reply: withLlmHint(fallback.reply, "failed", llmError),
    };
  }

  const direct = parseChatCommand(options);
  if (!isUnrecognizedCommand(direct)) {
    return { ...direct, llmStatus: "skipped" };
  }

  return {
    ...direct,
    llmStatus: "unconfigured",
    reply: withLlmHint(direct.reply, "unconfigured"),
  };
}
