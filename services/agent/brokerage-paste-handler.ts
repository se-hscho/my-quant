import type { ChatAction, ParseChatOptions } from "@/types/agent-chat";
import type { ImportedHoldingDraft } from "@/types/holdings-import";
import { createEmptySnapshot } from "@/lib/agent/holdings-storage";
import {
  buildSectorWeightComparison,
  buildValuationFromPasteRows,
  formatBrokeragePasteSummary,
} from "@/lib/agent/portfolio-weight-summary";
import { mergeImportedHoldingsIntoSnapshot } from "@/lib/agent/holdings-import-merge";
import { parseBrokeragePasteWithLlm } from "@/services/agent/brokerage-paste-llm";
import type { AgentChatResponse } from "@/services/agent/chat-orchestrator";

import type { BrokeragePasteRow } from "@/services/agent/brokerage-paste-llm";
import { deriveAvgCostFromPaste } from "@/lib/agent/cost-from-return";

const DEFAULT_FX = { usdKrw: 1350, jpyKrw: 9.2 };

function rowsToDrafts(
  rows: Awaited<ReturnType<typeof parseBrokeragePasteWithLlm>>["holdings"]
): ImportedHoldingDraft[] {
  return rows.map((r) => {
    const avgCost =
      r.returnPct != null
        ? deriveAvgCostFromPaste({
            valueKrw: r.valueKrw,
            returnPct: r.returnPct,
            quantity: r.quantity,
            currency: r.currency,
            fx: DEFAULT_FX,
          })
        : undefined;

    return {
      ticker: r.ticker,
      name: r.name,
      quantity: r.quantity,
      assetType: r.assetType,
      currency: r.currency,
      avgCost,
    };
  });
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

  const drafts = rowsToDrafts(parsed.holdings);
  const base = options.snapshot ?? createEmptySnapshot();
  const { snapshot } = mergeImportedHoldingsIntoSnapshot(base, drafts);
  const valuation = buildValuationFromPasteRows(parsed.holdings);
  const comparison = buildSectorWeightComparison({ snapshot, valuation });

  const reply = formatBrokeragePasteSummary({
    rows: parsed.holdings,
    comparison,
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
