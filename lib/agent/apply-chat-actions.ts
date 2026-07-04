import type { HoldingsSnapshot } from "@/types/agent";
import type { ChatAction } from "@/types/agent-chat";
import {
  createEmptySnapshot,
  loadHoldingsSnapshot,
  persistHoldingsSnapshot,
} from "./holdings-storage";
import { syncHoldingsToPersonal } from "./personal-sync";

export function applyChatActions(actions: ChatAction[]): HoldingsSnapshot {
  let snapshot = loadHoldingsSnapshot() ?? createEmptySnapshot();

  for (const action of actions) {
    switch (action.type) {
      case "add_holding":
        snapshot = {
          ...snapshot,
          holdings: [
            ...snapshot.holdings.filter(
              (h) => h.ticker.toUpperCase() !== action.ticker.toUpperCase()
            ),
            {
              id: crypto.randomUUID(),
              ticker: action.ticker,
              quantity: action.quantity,
              assetType: action.assetType,
              currency: action.currency,
              ...(action.avgCost != null && action.avgCost > 0
                ? { avgCost: action.avgCost }
                : {}),
            },
          ],
        };
        break;
      case "set_cash":
        snapshot = {
          ...snapshot,
          cash: { ...snapshot.cash, [action.field]: action.amount },
        };
        break;
      case "remove_holding":
        snapshot = {
          ...snapshot,
          holdings: snapshot.holdings.filter(
            (h) => h.ticker.toUpperCase() !== action.ticker.toUpperCase()
          ),
        };
        break;
    }
  }

  persistHoldingsSnapshot(snapshot);
  syncHoldingsToPersonal(snapshot);
  return snapshot;
}
