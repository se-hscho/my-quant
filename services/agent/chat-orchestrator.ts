import type { ChatAction, ChatCommandResult, ParseChatOptions } from "@/types/agent-chat";
import { looksLikeBrokeragePaste } from "@/lib/agent/brokerage-paste-detect";
import { isReadOnlyChatMessage, parseChatCommand } from "@/lib/agent/chat-commands";
import { ASSET_TYPE_LABELS } from "@/lib/agent/holdings-display";
import {
  GEMINI_DEFAULT_MODEL,
  isBlockedGeminiModel,
  isGeminiConfigured,
  isTransientGeminiError,
} from "@/services/ai/gemini";
import { answerBriefingQuestion } from "@/services/briefing/chat-qa";
import {
  canInvokeLlm,
  getLlmRateLimitStatus,
  recordLlmCall,
} from "@/services/ai/llm-rate-limit";
import { normalizeChatInputWithLlm } from "@/services/agent/chat-llm";
import { processBrokeragePasteMessage } from "@/services/agent/brokerage-paste-handler";

export interface AgentChatResponse extends ChatCommandResult {
  normalizedCommand?: string | null;
  usedLlm?: boolean;
  llmStatus?: "active" | "unconfigured" | "failed" | "skipped" | "rate_limited";
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
  const detail = llmError ? `\n(원인: ${llmError.slice(0, 200)})` : "";
  const envModel = process.env.GEMINI_MODEL?.trim();
  const modelLines: string[] = [];

  if (envModel && isBlockedGeminiModel(envModel)) {
    modelLines.push(
      `· GEMINI_MODEL=${envModel} 은 지원 종료. ${GEMINI_DEFAULT_MODEL} 로 변경하세요.`
    );
  }

  if (/API key not valid|forbidden/i.test(llmError ?? "")) {
    modelLines.push("· GEMINI_API_KEY는 Google AI Studio 키여야 합니다.");
  }

  return `${detail}\n\n💡 AI 해석에 실패했습니다. \`삼전 10주\`, \`SOXX 10주 등록\` 처럼 입력해 보세요.`;
}

function rateLimitHint(): string {
  const { retryAfterMs } = getLlmRateLimitStatus();
  const sec = Math.ceil(retryAfterMs / 1000);
  return `\n\n💡 AI 무료 한도 보호: 잠시 후(${sec}초) 다시 시도하거나 \`삼전 10주\`처럼 바로 인식되는 표현을 써 주세요.`;
}

function withLlmHint(
  reply: string,
  llmStatus: AgentChatResponse["llmStatus"],
  llmError?: string
): string {
  if (llmStatus === "unconfigured") {
    return `${reply}\n\n💡 자연어 AI는 GEMINI_API_KEY 설정 후 사용 가능합니다. 지금은 \`SOXX 10주 등록\`, \`삼전 10주\` 형식을 써 주세요.`;
  }
  if (llmStatus === "rate_limited") {
    return `${reply}${rateLimitHint()}`;
  }
  if (llmStatus === "failed") {
    const note = isTransientGeminiError(llmError ?? "")
      ? "\n\n💡 AI 서버가 혼잡합니다. 잠시 후 재시도하거나 아래 형식을 사용하세요."
      : buildLlmFailureHint(llmError);
    return `${reply}${note}`;
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
  recordLlmCall();
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

  return {
    error: llm.error ?? "no actions in llm response",
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

  if (options.briefing) {
    const qa = answerBriefingQuestion(message, options.briefing);
    if (qa) {
      return { reply: qa, actions: [], llmStatus: "skipped" };
    }
  }

  if (looksLikeBrokeragePaste(message)) {
    if (!isGeminiConfigured()) {
      return {
        reply:
          "보유 목록 붙여넣기는 GEMINI_API_KEY 설정 후 사용할 수 있습니다.\n" +
          "지금은 `SOXX 10주` 형식으로 등록해 주세요. (참고용)",
        actions: [],
        llmStatus: "unconfigured",
      };
    }
    if (!canInvokeLlm()) {
      return {
        reply: `보유 목록 분석 한도에 도달했습니다.${rateLimitHint()}`,
        actions: [],
        llmStatus: "rate_limited",
      };
    }
    recordLlmCall();
    return processBrokeragePasteMessage(message, options);
  }

  if (isReadOnlyChatMessage(message)) {
    return { ...parseChatCommand(options), llmStatus: "skipped" };
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

  if (!canInvokeLlm()) {
    return {
      ...direct,
      llmStatus: "rate_limited",
      reply: withLlmHint(direct.reply, "rate_limited"),
    };
  }

  const { response: llmResult, error: llmError } = await tryLlmMutation(message);
  if (llmResult.llmStatus === "active") {
    return llmResult;
  }

  const fallback = parseChatCommand(options);
  if (!isUnrecognizedCommand(fallback)) {
    const note = isTransientGeminiError(llmError ?? "")
      ? "\n\n💡 AI가 혼잡해 규칙으로 바로 처리했습니다."
      : "\n\n💡 AI 해석 실패 — 규칙으로 처리했습니다.";
    return {
      ...fallback,
      llmStatus: "failed",
      reply: `${fallback.reply}${note}`,
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
