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
import type { AgentChatApiResponse } from "@/types/agent-chat";
import type { StoredChatMessage } from "@/types/agent-personal";
import type { Holding, HoldingsSnapshot } from "@/types/agent";
import type {
  HoldingsImportResult,
  ImportedHoldingDraft,
} from "@/types/holdings-import";
import { applyChatActions } from "@/lib/agent/apply-chat-actions";
import {
  applySectorTagAndPersist,
  formatImportedHoldingsSummary,
  persistImportedHoldings,
} from "@/lib/agent/apply-holdings-import";
import { fetchHoldingsImportFromImage } from "@/lib/agent/holdings-image";
import { persistChatWithSync } from "@/lib/agent/personal-sync";
import { loadHoldingsSnapshot } from "@/lib/agent/holdings-storage";
import type { AgentSectorId } from "@/config/agent";
import type { Region } from "@/types/agent";
import { useAgentPersonal } from "./AgentPersonalProvider";
import { HoldingsImportPreviewDialog } from "./HoldingsImportPreviewDialog";
import { SectorTagDialog } from "./SectorTagDialog";
import { toast } from "sonner";
import type { ChatAction } from "@/types/agent-chat";

function toastForActions(actions: ChatAction[]) {
  if (actions.length === 0) return;
  const hasAdd = actions.some((a) => a.type === "add_holding");
  const hasCash = actions.some((a) => a.type === "set_cash");
  const hasRemove = actions.some((a) => a.type === "remove_holding");
  if (hasAdd) {
    toast.success("보유가 등록되었습니다", {
      description: "대시보드에 반영됩니다. (참고용)",
    });
  } else if (hasCash) {
    toast.success("현금이 반영되었습니다", { description: "참고용 안내입니다." });
  } else if (hasRemove) {
    toast.success("보유에서 제거되었습니다", { description: "참고용 안내입니다." });
  }
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface AgentChatContextValue {
  messages: ChatMessage[];
  isPending: boolean;
  isImporting: boolean;
  sendMessage: (text: string) => Promise<void>;
  importHoldingsFromImage: (file: File) => Promise<void>;
}

const AgentChatContext = createContext<AgentChatContextValue | null>(null);

export function useAgentChat() {
  const ctx = use(AgentChatContext);
  if (!ctx) {
    throw new Error("useAgentChat must be used within AgentChatProvider");
  }
  return ctx;
}

interface ChatApiResponse extends AgentChatApiResponse {}

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
  const [isImporting, setIsImporting] = useState(false);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewResult, setPreviewResult] = useState<HoldingsImportResult | null>(null);
  const [previewThumb, setPreviewThumb] = useState<string | null>(null);

  const [sectorDialogOpen, setSectorDialogOpen] = useState(false);
  const [sectorQueue, setSectorQueue] = useState<Holding[]>([]);
  const [workingSnapshot, setWorkingSnapshot] = useState<HoldingsSnapshot | null>(null);
  const [pendingImportReply, setPendingImportReply] = useState<string | null>(null);

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

  const appendAssistantReply = useCallback(
    async (priorMessages: ChatMessage[], reply: string) => {
      const withReply: ChatMessage[] = [
        ...priorMessages,
        { id: crypto.randomUUID(), role: "assistant", content: reply },
      ];
      setMessages(withReply);
      await persistMessages(withReply);
    },
    [persistMessages]
  );

  const finishImportWithSectorQueue = useCallback(
    async (
      priorMessages: ChatMessage[],
      reply: string,
      needsSectorTag: Holding[],
      snapshot: HoldingsSnapshot
    ) => {
      if (needsSectorTag.length === 0) {
        await appendAssistantReply(priorMessages, reply);
        toast.success("보유가 등록되었습니다", {
          description: "브리핑에 반영됩니다. (참고용)",
        });
        return;
      }
      setPendingImportReply(reply);
      setWorkingSnapshot(snapshot);
      setSectorQueue(needsSectorTag);
      setSectorDialogOpen(true);
    },
    [appendAssistantReply]
  );

  const handleSectorConfirm = useCallback(
    async (sector: AgentSectorId, region?: Region) => {
      if (sectorQueue.length === 0 || !workingSnapshot) return;

      const [current, ...rest] = sectorQueue;
      const updated = await applySectorTagAndPersist(
        workingSnapshot,
        current.id,
        sector,
        region
      );
      setWorkingSnapshot(updated);
      setSectorQueue(rest);

      if (rest.length === 0) {
        setSectorDialogOpen(false);
        if (pendingImportReply) {
          const reply = pendingImportReply;
          setPendingImportReply(null);
          setMessages((prev) => {
            const withReply: ChatMessage[] = [
              ...prev,
              { id: crypto.randomUUID(), role: "assistant", content: reply },
            ];
            void persistMessages(withReply);
            return withReply;
          });
          toast.success("보유가 등록되었습니다", {
            description: "브리핑에 반영됩니다. (참고용)",
          });
        }
      }
    },
    [sectorQueue, workingSnapshot, pendingImportReply, persistMessages]
  );

  const confirmImageImport = useCallback(
    async (selected: ImportedHoldingDraft[], cash?: HoldingsImportResult["cash"]) => {
      if (!previewResult) return;

      setPreviewOpen(false);
      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: `📷 보유 화면 캡처 등록 (${selected.length}개 종목)`,
      };
      const withUser = [...messages, userMsg];
      setMessages(withUser);
      await persistMessages(withUser);

      try {
        const { snapshot, needsSectorTag } = await persistImportedHoldings(selected, cash);
        const reply =
          `스크린샷에서 ${selected.length}개 종목을 등록했습니다.\n\n` +
          `${formatImportedHoldingsSummary(selected)}\n\n` +
          (previewResult.confidence === "low"
            ? "인식 신뢰도가 낮습니다 — /agent/holdings에서 값을 확인해 주세요.\n\n"
            : "") +
          "브리핑이 갱신됩니다. (참고용·투자 권유 아님)";

        await finishImportWithSectorQueue(withUser, reply, needsSectorTag, snapshot);
      } catch {
        await appendAssistantReply(
          withUser,
          "보유 등록 저장에 실패했습니다. /agent/holdings에서 다시 시도해 주세요."
        );
      } finally {
        setPreviewResult(null);
        if (previewThumb) {
          URL.revokeObjectURL(previewThumb);
          setPreviewThumb(null);
        }
      }
    },
    [
      previewResult,
      previewThumb,
      messages,
      persistMessages,
      finishImportWithSectorQueue,
      appendAssistantReply,
    ]
  );

  const importHoldingsFromImage = useCallback(
    async (file: File) => {
      if (isImporting || isPending) return;

      setIsImporting(true);
      try {
        const data = await fetchHoldingsImportFromImage(file);
        if (!data.ok) {
          toast.error("스크린샷 인식 실패", { description: data.error });
          return;
        }

        setPreviewResult(data.result);
        setPreviewThumb(URL.createObjectURL(file));
        setPreviewOpen(true);
      } catch {
        toast.error("업로드 실패", { description: "네트워크 연결을 확인해 주세요." });
      } finally {
        setIsImporting(false);
      }
    },
    [isImporting, isPending]
  );

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
          toastForActions(actions);
        }
        await appendAssistantReply(withUser, reply);
      } catch {
        await appendAssistantReply(
          withUser,
          "답변을 생성하지 못했습니다. 잠시 후 다시 시도해 주세요. (투자 권유가 아닌 참고용 안내입니다.)"
        );
      } finally {
        setIsPending(false);
      }
    },
    [isPending, messages, appendAssistantReply]
  );

  const value = useMemo(
    () => ({
      messages,
      isPending,
      isImporting,
      sendMessage,
      importHoldingsFromImage,
    }),
    [messages, isPending, isImporting, sendMessage, importHoldingsFromImage]
  );

  return (
    <AgentChatContext value={value}>
      {children}

      {previewResult ? (
        <HoldingsImportPreviewDialog
          open={previewOpen}
          onOpenChange={(open) => {
            setPreviewOpen(open);
            if (!open) {
              setPreviewResult(null);
              if (previewThumb) {
                URL.revokeObjectURL(previewThumb);
                setPreviewThumb(null);
              }
            }
          }}
          result={previewResult}
          thumbnailUrl={previewThumb}
          onConfirm={(selected, cash) => void confirmImageImport(selected, cash)}
        />
      ) : null}

      <SectorTagDialog
        open={sectorDialogOpen}
        ticker={sectorQueue[0]?.ticker ?? ""}
        onOpenChange={(open) => {
          setSectorDialogOpen(open);
          if (!open) {
            setSectorQueue([]);
            setPendingImportReply(null);
          }
        }}
        onConfirm={(sector, region) => void handleSectorConfirm(sector, region)}
      />
    </AgentChatContext>
  );
}
