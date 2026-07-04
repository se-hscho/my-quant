import type { AgentPersonalData } from "@/types/agent-personal";
import type { HoldingsSnapshot } from "@/types/agent";
import { createEmptySnapshot } from "@/lib/agent/holdings-storage";

const USER_ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isAgentUserId(id: string): boolean {
  return USER_ID_RE.test(id);
}

function isHoldingsSnapshot(v: unknown): v is HoldingsSnapshot {
  if (!v || typeof v !== "object") return false;
  const o = v as HoldingsSnapshot;
  return (
    Array.isArray(o.holdings) &&
    typeof o.cash === "object" &&
    typeof o.updatedAt === "string"
  );
}

export function isAgentPersonalData(v: unknown): v is AgentPersonalData {
  if (!v || typeof v !== "object") return false;
  const o = v as AgentPersonalData;
  return (
    isHoldingsSnapshot(o.holdings) &&
    Array.isArray(o.chatMessages) &&
    typeof o.updatedAt === "string"
  );
}

export function emptyPersonalData(): AgentPersonalData {
  const holdings = createEmptySnapshot();
  return {
    holdings,
    chatMessages: [],
    updatedAt: holdings.updatedAt,
  };
}

export function mergePersonalData(
  local: AgentPersonalData | null,
  remote: AgentPersonalData | null
): AgentPersonalData {
  if (!local && !remote) return emptyPersonalData();
  if (!local) return remote!;
  if (!remote) return local;
  const localTime = new Date(local.updatedAt).getTime();
  const remoteTime = new Date(remote.updatedAt).getTime();
  return remoteTime >= localTime ? remote : local;
}
