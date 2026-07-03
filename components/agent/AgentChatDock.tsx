"use client";

import { useEffect, useState, type FormEvent } from "react";
import { ChevronUpIcon, SendIcon } from "lucide-react";
import { useAgentChat } from "./AgentChatProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type LlmStatus = "checking" | "active" | "inactive";

export function AgentChatDock() {
  const { messages, isPending, sendMessage } = useAgentChat();
  const [input, setInput] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [llmStatus, setLlmStatus] = useState<LlmStatus>("checking");

  const hasMessages = messages.length > 0;
  const showTranscript = expanded && hasMessages;

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/agent/chat/status", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { geminiActive?: boolean; geminiConfigured?: boolean } | null) => {
        if (cancelled) return;
        setLlmStatus(
          data?.geminiActive
            ? "active"
            : data?.geminiConfigured
              ? "inactive"
              : "inactive"
        );
      })
      .catch(() => {
        if (!cancelled) setLlmStatus("inactive");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const text = input;
    setInput("");
    if (!text.trim() || isPending) return;
    setExpanded(true);
    await sendMessage(text);
  }

  return (
    <div
      className="shrink-0 border-t bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80"
      data-testid="agent-chat-dock"
    >
      <div className="mx-auto flex max-h-[min(42vh,17rem)] max-w-3xl flex-col">
        <div className="flex shrink-0 items-center justify-between gap-2 px-4 pt-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">
              에이전트 대화
            </span>
            {llmStatus === "checking" ? (
              <span className="text-[10px] text-muted-foreground">AI 확인 중…</span>
            ) : llmStatus === "active" ? (
              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-700 dark:text-emerald-400">
                AI 자연어 ON
              </span>
            ) : (
              <span
                className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] text-amber-800 dark:text-amber-400"
                title="키는 있으나 API 연결 실패 — /api/agent/chat/status 확인"
              >
                AI 연결 실패
              </span>
            )}
          </div>
          {hasMessages ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-expanded={expanded}
              aria-label={expanded ? "대화 접기" : "대화 펼치기"}
              onClick={() => setExpanded((v) => !v)}
            >
              <ChevronUpIcon
                className={cn(
                  "h-4 w-4 transition-transform",
                  expanded ? "rotate-180" : ""
                )}
              />
            </Button>
          ) : null}
        </div>

        {showTranscript ? (
          <ul
            className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain px-4 pb-2 text-sm"
            aria-live="polite"
          >
            {messages.map((m) => (
              <li
                key={m.id}
                className={cn(
                  "rounded-lg px-3 py-2 whitespace-pre-wrap break-words",
                  m.role === "user"
                    ? "ml-8 bg-muted text-right"
                    : "mr-4 border bg-background text-left"
                )}
              >
                {m.content}
              </li>
            ))}
            {isPending ? (
              <li className="mr-4 text-xs text-muted-foreground">답변 생성 중…</li>
            ) : null}
          </ul>
        ) : hasMessages ? (
          <button
            type="button"
            className="mx-4 mb-1 truncate text-left text-xs text-muted-foreground hover:text-foreground"
            onClick={() => setExpanded(true)}
          >
            최근: {messages.at(-1)?.content.replace(/\s+/g, " ").slice(0, 80)}
            {(messages.at(-1)?.content.length ?? 0) > 80 ? "…" : ""}
          </button>
        ) : null}

        <form onSubmit={handleSubmit} className="flex shrink-0 gap-2 px-4 py-3">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="질문을 입력하세요… (예: 반도체 etf 10주 샀어)"
            aria-label="에이전트에게 질문"
            disabled={isPending}
            className="flex-1"
          />
          <Button
            type="submit"
            size="icon"
            disabled={isPending || !input.trim()}
            aria-label="질문 보내기"
          >
            <SendIcon className="h-4 w-4" />
          </Button>
        </form>
        <p className="shrink-0 px-4 pb-2 text-[10px] text-muted-foreground">
          참고용 안내이며 투자 권유가 아닙니다.
        </p>
      </div>
    </div>
  );
}
