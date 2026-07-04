import type { HoldingsSnapshot } from "@/types/agent";

export interface StoredChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export interface AgentPersonalData {
  holdings: HoldingsSnapshot;
  chatMessages: StoredChatMessage[];
  updatedAt: string;
}

export const AGENT_USER_ID_KEY = "agent:user-id:v1";
export const AGENT_PERSONAL_DATA_KEY = "agent:personal-data:v1";
