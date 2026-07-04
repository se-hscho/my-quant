"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { ChevronUpIcon, ImageUpIcon, Loader2Icon, SendIcon } from "lucide-react";
import { useAgentChat } from "./AgentChatProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const QUICK_PROMPTS = [
  "삼전 10주",
  "반도체 etf 10주 샀어",
  "안 1 설명해줘",
  "보유 목록 보여줘",
  "현금 오만원 추가",
  "도움말",
] as const;

type LlmStatus = "checking" | "active" | "unconfigured" | "failed";

interface ChatStatusPayload {
  geminiActive?: boolean;
  geminiConfigured?: boolean;
  hints?: string[];
  llmRateLimit?: { remaining: number };
}

function resolveLlmStatus(data: ChatStatusPayload | null): LlmStatus {
  if (!data) return "failed";
  if (data.geminiActive) return "active";
  if (data.geminiConfigured) return "failed";
  return "unconfigured";
}

export function AgentChatDock() {
  const { messages, isPending, isImporting, sendMessage, importHoldingsFromImage } =
    useAgentChat();
  const [input, setInput] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [llmStatus, setLlmStatus] = useState<LlmStatus>("checking");
  const [statusHint, setStatusHint] = useState<string | null>(null);
  const chatImageRef = useRef<HTMLInputElement>(null);

  const hasMessages = messages.length > 0;
  const showTranscript = expanded && hasMessages;
  const busy = isPending || isImporting;

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/agent/chat/status", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: ChatStatusPayload | null) => {
        if (cancelled) return;
        setLlmStatus(resolveLlmStatus(data));
        setStatusHint(data?.hints?.[0] ?? null);
      })
      .catch(() => {
        if (!cancelled) {
          setLlmStatus("failed");
          setStatusHint("AI 상태를 확인하지 못했습니다. 네트워크 연결을 확인해 주세요.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const text = input;
    setInput("");
    if (!text.trim() || busy) return;
    setExpanded(true);
    await sendMessage(text);
  }

  async function handleQuickPrompt(text: string) {
    if (busy) return;
    setExpanded(true);
    await sendMessage(text);
  }

  async function handleChatImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || busy) return;
    setExpanded(true);
    await importHoldingsFromImage(file);
  }

  const statusLabel =
    llmStatus === "checking"
      ? "AI 확인 중…"
      : llmStatus === "active"
        ? "규칙 우선 · AI 보조"
        : llmStatus === "unconfigured"
          ? "오프라인 · 키 미설정"
          : "오프라인 · AI 연결 실패";

  const statusDetail =
    llmStatus === "active"
      ? "자주 쓰는 명령은 규칙 처리, 나머지는 AI 보조"
      : llmStatus === "unconfigured"
        ? "GEMINI_API_KEY 없음 — 규칙 파서·텍스트 등록만 가능"
        : "GEMINI 연결 실패 — 규칙 파서·텍스트 등록만 가능";

  return (
    <div
      className="shrink-0 border-t bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80"
      data-testid="agent-chat-dock"
    >
      <div className="mx-auto flex max-h-[min(48vh,20rem)] max-w-3xl flex-col">
        <div className="flex shrink-0 items-center justify-between gap-2 px-4 pt-2">
          <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">
                에이전트 대화
              </span>
              {llmStatus === "checking" ? (
                <span className="text-[10px] text-muted-foreground">{statusLabel}</span>
              ) : llmStatus === "active" ? (
                <span
                  className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-700 dark:text-emerald-400"
                  title={statusDetail}
                >
                  {statusLabel}
                </span>
              ) : (
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px]",
                    llmStatus === "unconfigured"
                      ? "bg-muted text-muted-foreground"
                      : "bg-amber-500/10 text-amber-800 dark:text-amber-300"
                  )}
                  title={statusHint ?? statusDetail}
                >
                  {statusLabel}
                </span>
              )}
            </div>
            <span className="text-[10px] text-muted-foreground sm:hidden">{statusDetail}</span>
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

        {llmStatus !== "active" && llmStatus !== "checking" && statusHint ? (
          <p
            className="px-4 pb-1 text-[10px] text-muted-foreground"
            data-testid="agent-chat-status-hint"
          >
            {statusHint}
          </p>
        ) : null}

        <div className="flex shrink-0 flex-wrap gap-1.5 px-4 pb-1">
          {QUICK_PROMPTS.map((text) => (
            <Button
              key={text}
              type="button"
              variant="outline"
              size="sm"
              className="h-7 text-[11px]"
              disabled={busy}
              onClick={() => void handleQuickPrompt(text)}
            >
              {text}
            </Button>
          ))}
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
            {busy ? (
              <li className="mr-4 text-xs text-muted-foreground">
                {isImporting ? "스크린샷 분석 중…" : "답변 생성 중…"}
              </li>
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
          <input
            ref={chatImageRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
            capture="environment"
            className="sr-only"
            aria-hidden
            onChange={handleChatImageChange}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            disabled={busy}
            aria-label="보유 화면 캡처 첨부"
            title="보유 앱 캡처로 종목 등록 (GEMINI 필요)"
            onClick={() => chatImageRef.current?.click()}
          >
            {isImporting ? (
              <Loader2Icon className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <ImageUpIcon className="h-4 w-4" aria-hidden />
            )}
          </Button>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="삼전 10주 · 📷 버튼으로 캡처 등록…"
            aria-label="에이전트에게 질문"
            disabled={busy}
            className="flex-1"
          />
          <Button
            type="submit"
            size="icon"
            disabled={busy || !input.trim()}
            aria-label="질문 보내기"
          >
            <SendIcon className="h-4 w-4" />
          </Button>
        </form>
        <p className="shrink-0 px-4 pb-2 text-[10px] text-muted-foreground">
          📷 보유 캡처 등록·자연어 AI는 GEMINI_API_KEY가 필요합니다. 지금은 &quot;SOXX
          10주&quot; 같은 규칙 입력은 가능합니다. 참고용·투자 권유 아님.
        </p>
      </div>
    </div>
  );
}
