"use client";

import { useState, type FormEvent } from "react";
import { ChevronUpIcon, SendIcon } from "lucide-react";
import { useAgentChat } from "./AgentChatProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function AgentChatDock() {
  const { messages, isPending, sendMessage } = useAgentChat();
  const [input, setInput] = useState("");
  const [expanded, setExpanded] = useState(false);

  const hasMessages = messages.length > 0;
  const showPanel = expanded || hasMessages;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const text = input;
    setInput("");
    if (!expanded && hasMessages) setExpanded(true);
    await sendMessage(text);
    setExpanded(true);
  }

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-50 border-t bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80"
      data-testid="agent-chat-dock"
    >
      <div className="mx-auto max-w-3xl px-4">
        {showPanel ? (
          <div className="pt-2">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                에이전트 대화
              </span>
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
            </div>
            {expanded ? (
              <ul
                className="mb-2 max-h-48 space-y-2 overflow-y-auto text-sm"
                aria-live="polite"
              >
                {messages.map((m) => (
                  <li
                    key={m.id}
                    className={cn(
                      "rounded-lg px-3 py-2",
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
            ) : null}
          </div>
        ) : null}

        <form
          onSubmit={handleSubmit}
          className="flex gap-2 py-3"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="질문을 입력하세요… (예: 안 2만 자세히 설명해줘)"
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
        <p className="pb-2 text-[10px] text-muted-foreground">
          참고용 안내이며 투자 권유가 아닙니다.
        </p>
      </div>
    </div>
  );
}
