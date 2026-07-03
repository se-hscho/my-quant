import type { AssetType, Currency, HoldingsSnapshot } from "@/types/agent";

export type CashField = "krw" | "usd" | "jpy";

export type ChatAction =
  | {
      type: "add_holding";
      ticker: string;
      quantity: number;
      assetType: AssetType;
      currency: Currency;
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
}
