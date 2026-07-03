"use client";

import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { ChatAction } from "@/types/agent-chat";
import type { StoredChatMessage } from "@/types/agent-personal";
import { applyChatActions } from "@/lib/agent/apply-chat-actions";
import {
  persistChatWithSync,
} from "@/lib/agent/personal-sync";
import { loadHoldingsSnapshot } from "@/lib/agent/holdings-storage";
import { useAgentPersonal } from "./AgentPersonalProvider";

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

interface ChatApiResponse {
  reply: string;
  actions?: ChatAction[];
}

async function fetchChatReply(message: string): Promise<ChatApiResponse> {
  const res = await fetch("/api/agent/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      snapshot: loadHoldingsSnapshot(),
    }),
  });
  if (!res.ok) {
    throw new Error("chat failed");
  }
  return res.json() as Promise<ChatApiResponse>;
}

export function AgentChatProvider({ children }: { children: ReactNode }) {
  const { ready, data } = useAgentPersonal();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    if (ready && data?.chatMessages?.length) {
      setMessages(data.chatMessages);
    }
  }, [ready, data]);

  const persistMessages = useCallback(async (next: ChatMessage[]) => {
    const stored: StoredChatMessage[] = next.map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
    }));
    await persistChatWithSync(stored);
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isPending) return;

      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: trimmed,
      };
      const withUser = [...messages, userMsg];
      setMessages(withUser);
      setIsPending(true);

      try {
        const { reply, actions = [] } = await fetchChatReply(trimmed);
        if (actions.length > 0) {
          applyChatActions(actions);
        }
        const withReply: ChatMessage[] = [
          ...withUser,
          { id: crypto.randomUUID(), role: "assistant", content: reply },
        ];
        setMessages(withReply);
        await persistMessages(withReply);
      } catch {
        const withError: ChatMessage[] = [
          ...withUser,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content:
              "답변을 생성하지 못했습니다. 잠시 후 다시 시도해 주세요. (투자 권유가 아닌 참고용 안내입니다.)",
          },
        ];
        setMessages(withError);
        await persistMessages(withError);
      } finally {
        setIsPending(false);
      }
    },
    [isPending, messages, persistMessages]
  );

  const value = useMemo(
    () => ({ messages, isPending, sendMessage }),
    [messages, isPending, sendMessage]
  );

  return (
    <AgentChatContext value={value}>{children}</AgentChatContext>
  );
}
