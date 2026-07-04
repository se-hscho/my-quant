import type { ChatAction, ParseChatOptions } from "@/types/agent-chat";
import type { ImportedHoldingDraft } from "@/types/holdings-import";
import { enrichBrokeragePasteRows } from "@/lib/agent/enrich-paste-holdings";
import { createEmptySnapshot } from "@/lib/agent/holdings-storage";
import {
  buildAssetClassWeights,
  buildSectorWeightComparison,
  buildSubSectorWeightRows,
  buildValuationFromPasteRows,
  formatBrokeragePasteSummary,
} from "@/lib/agent/portfolio-weight-summary";
import { mergeImportedHoldingsIntoSnapshot } from "@/lib/agent/holdings-import-merge";
import { parseBrokeragePasteWithLlm } from "@/services/agent/brokerage-paste-llm";
import type { AgentChatResponse } from "@/services/agent/chat-orchestrator";

function rowsToDrafts(
  rows: Awaited<ReturnType<typeof enrichBrokeragePasteRows>>
): ImportedHoldingDraft[] {
  return rows.map((r) => ({
    ticker: r.ticker,
    name: r.name,
    quantity: r.quantity,
    assetType: r.assetType,
    currency: r.currency,
    avgCost: r.avgCost,
  }));
}

function draftsToActions(drafts: ImportedHoldingDraft[]): ChatAction[] {
  return drafts.map((d) => ({
    type: "add_holding" as const,
    ticker: d.ticker,
    quantity: d.quantity,
    assetType: d.assetType,
    currency: d.currency,
    ...(d.avgCost != null && d.avgCost > 0 ? { avgCost: d.avgCost } : {}),
  }));
}

export async function processBrokeragePasteMessage(
  message: string,
  options: ParseChatOptions
): Promise<AgentChatResponse> {
  const parsed = await parseBrokeragePasteWithLlm(message);
  if (parsed.error || parsed.holdings.length === 0) {
    return {
      reply:
        `보유 목록을 읽지 못했습니다.\n${parsed.error ?? ""}\n\n` +
        "📷 캡처 업로드 또는 `SOXX 10주` 형식도 사용할 수 있습니다. (참고용)",
      actions: [],
      usedLlm: true,
      llmStatus: "failed",
    };
  }

  const enriched = await enrichBrokeragePasteRows(parsed.holdings);
  const drafts = rowsToDrafts(enriched);
  const base = options.snapshot ?? createEmptySnapshot();
  const { snapshot } = mergeImportedHoldingsIntoSnapshot(base, drafts);
  const valuation = buildValuationFromPasteRows(enriched);
  const comparison = buildSectorWeightComparison({ snapshot, valuation });
  const assetClasses = buildAssetClassWeights({ snapshot, valuation });
  const subSectors = buildSubSectorWeightRows({ snapshot, valuation });

  const reply = formatBrokeragePasteSummary({
    rows: enriched,
    comparison,
    assetClasses,
    subSectors,
    totalKrw: valuation.totalKrw,
    confidence: parsed.confidence,
  });

  return {
    reply,
    actions: draftsToActions(drafts),
    usedLlm: true,
    llmStatus: "active",
  };
}
