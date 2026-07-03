"use client";

import {
  createContext,
  use,
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface AgentChatContextValue {
  messages: ChatMessage[];
  isPending: boolean;
  sendMessage: (text: string) => Promise<void>;
}

const AgentChatContext = createContext<AgentChatContextValue | null>(null);

export function useAgentChat() {
  const ctx = use(AgentChatContext);
  if (!ctx) {
    throw new Error("useAgentChat must be used within AgentChatProvider");
  }
  return ctx;
}

async function fetchChatReply(message: string): Promise<string> {
  const res = await fetch("/api/agent/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  });
  if (!res.ok) {
    throw new Error("chat failed");
  }
  const data = (await res.json()) as { reply: string };
  return data.reply;
}

export function AgentChatProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isPending, setIsPending] = useState(false);

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isPending) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsPending(true);

    try {
      const reply = await fetchChatReply(trimmed);
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "assistant", content: reply },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content:
            "답변을 생성하지 못했습니다. 잠시 후 다시 시도해 주세요. (투자 권유가 아닌 참고용 안내입니다.)",
        },
      ]);
    } finally {
      setIsPending(false);
    }
  }, [isPending]);

  const value = useMemo(
    () => ({ messages, isPending, sendMessage }),
    [messages, isPending, sendMessage]
  );

  return (
    <AgentChatContext value={value}>{children}</AgentChatContext>
  );
}
