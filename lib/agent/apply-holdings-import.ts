import type { Holding, HoldingsSnapshot } from "@/types/agent";
import type { ImportedHoldingDraft, HoldingsImportResult } from "@/types/holdings-import";
import {
  applySectorTagToSnapshotHolding,
  mergeImportedHoldingsIntoSnapshot,
} from "@/lib/agent/holdings-import-merge";
import {
  createEmptySnapshot,
  loadHoldingsSnapshot,
} from "@/lib/agent/holdings-storage";
import { persistHoldingsWithSync } from "@/lib/agent/personal-sync";
import type { AgentSectorId } from "@/config/agent";
import type { Region } from "@/types/agent";

export function formatImportedHoldingsSummary(
  holdings: ImportedHoldingDraft[]
): string {
  return holdings
    .map((h) => {
      const cost =
        h.avgCost != null ? ` · 매수 ${h.avgCost.toLocaleString()}${h.currency}` : "";
      return `${h.ticker} ${h.quantity}주${cost}`;
    })
    .join("\n");
}

export async function persistImportedHoldings(
  imported: ImportedHoldingDraft[],
  cash?: HoldingsImportResult["cash"]
): Promise<{ snapshot: HoldingsSnapshot; needsSectorTag: Holding[] }> {
  const current = loadHoldingsSnapshot() ?? createEmptySnapshot();
  const { snapshot, needsSectorTag } = mergeImportedHoldingsIntoSnapshot(
    current,
    imported,
    cash
  );
  const stamped = { ...snapshot, updatedAt: new Date().toISOString() };
  await persistHoldingsWithSync(stamped);
  return { snapshot: stamped, needsSectorTag };
}

export async function applySectorTagAndPersist(
  snapshot: HoldingsSnapshot,
  holdingId: string,
  sector: AgentSectorId,
  region?: Region
): Promise<HoldingsSnapshot> {
  const updated = applySectorTagToSnapshotHolding(snapshot, holdingId, sector, region);
  const stamped = { ...updated, updatedAt: new Date().toISOString() };
  await persistHoldingsWithSync(stamped);
  return stamped;
}
