import type { AssetType, Currency, HoldingsSnapshot } from "@/types/agent";
import type { Briefing } from "@/services/briefing/types";

export type CashField = "krw" | "usd" | "jpy";

export type ChatAction =
  | {
      type: "add_holding";
      ticker: string;
      quantity: number;
      assetType: AssetType;
      currency: Currency;
      /** 붙여넣기·스크린샷 등에서 역산된 1주당 매수가 */
      avgCost?: number;
    }
  | { type: "set_cash"; field: CashField; amount: number }
  | { type: "remove_holding"; ticker: string };

export interface ChatCommandResult {
  reply: string;
  actions: ChatAction[];
}

export interface AgentChatApiResponse extends ChatCommandResult {
  normalizedCommand?: string | null;
  usedLlm?: boolean;
  llmStatus?: "active" | "unconfigured" | "failed" | "skipped";
}

export interface ParseChatOptions {
  message: string;
  snapshot?: HoldingsSnapshot | null;
  briefing?: Briefing | null;
}
