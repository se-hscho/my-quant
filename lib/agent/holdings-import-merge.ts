import { applySectorTag, classifyTicker } from "@/lib/agent/sector-classify";
import type { Holding, HoldingsSnapshot } from "@/types/agent";
import type { ImportedHoldingDraft } from "@/types/holdings-import";

export function importedDraftToHolding(draft: ImportedHoldingDraft): Holding {
  const base: Holding = {
    id: crypto.randomUUID(),
    ticker: draft.ticker,
    quantity: draft.quantity,
    avgCost: draft.avgCost,
    assetType: draft.assetType,
    currency: draft.currency,
  };

  const classification = classifyTicker(draft.ticker);
  return classification ? applySectorTag(base, classification.sector, classification.region) : base;
}

/** 스크린샷 import를 draft에 병합. 동일 티커는 교체 */
export function mergeImportedHoldingsIntoSnapshot(
  draft: HoldingsSnapshot,
  imported: ImportedHoldingDraft[],
  cash?: Partial<HoldingsSnapshot["cash"]>
): { snapshot: HoldingsSnapshot; needsSectorTag: Holding[] } {
  const mergedHoldings = [...draft.holdings];
  const needsSectorTag: Holding[] = [];

  for (const item of imported) {
    const holding = importedDraftToHolding(item);
    const idx = mergedHoldings.findIndex(
      (h) => h.ticker.toUpperCase() === holding.ticker.toUpperCase()
    );
    let stored: Holding;
    if (idx >= 0) {
      stored = { ...holding, id: mergedHoldings[idx].id };
      mergedHoldings[idx] = stored;
    } else {
      stored = holding;
      mergedHoldings.push(stored);
    }
    if (!stored.sector) {
      needsSectorTag.push(stored);
    }
  }

  const nextCash = cash
    ? {
        krw: cash.krw ?? draft.cash.krw,
        usd: cash.usd ?? draft.cash.usd,
        jpy: cash.jpy ?? draft.cash.jpy,
      }
    : draft.cash;

  return {
    snapshot: {
      ...draft,
      holdings: mergedHoldings,
      cash: nextCash,
    },
    needsSectorTag,
  };
}

/** 섹터 태그 적용 후 snapshot 갱신 */
export function applySectorTagToSnapshotHolding(
  snapshot: HoldingsSnapshot,
  holdingId: string,
  sector: Parameters<typeof applySectorTag>[1],
  region?: Parameters<typeof applySectorTag>[2]
): HoldingsSnapshot {
  return {
    ...snapshot,
    holdings: snapshot.holdings.map((h) =>
      h.id === holdingId ? applySectorTag(h, sector, region) : h
    ),
  };
}
