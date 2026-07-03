import type { AgentPersonalData, StoredChatMessage } from "@/types/agent-personal";
import { AGENT_PERSONAL_DATA_KEY } from "@/types/agent-personal";
import type { HoldingsSnapshot } from "@/types/agent";
import {
  createEmptySnapshot,
  loadHoldingsSnapshot,
  notifyHoldingsUpdated,
  saveHoldingsSnapshot,
} from "./holdings-storage";
import { getOrCreateAgentUserId } from "./user-id";
import {
  emptyPersonalData,
  mergePersonalData,
} from "@/services/agent/personal-data";

function loadLocalPersonalData(): AgentPersonalData | null {
  if (typeof localStorage === "undefined") return null;
  const raw = localStorage.getItem(AGENT_PERSONAL_DATA_KEY);
  if (!raw) {
    const holdings = loadHoldingsSnapshot();
    if (!holdings) return null;
    return {
      holdings,
      chatMessages: [],
      updatedAt: holdings.updatedAt,
    };
  }
  try {
    return JSON.parse(raw) as AgentPersonalData;
  } catch {
    return null;
  }
}

function saveLocalPersonalData(data: AgentPersonalData): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(AGENT_PERSONAL_DATA_KEY, JSON.stringify(data));
  saveHoldingsSnapshot(data.holdings);
}

export function getPersonalDataFromLocal(): AgentPersonalData {
  return loadLocalPersonalData() ?? emptyPersonalData();
}

export async function fetchRemotePersonalData(
  userId: string
): Promise<AgentPersonalData | null> {
  try {
    const res = await fetch("/api/agent/data", {
      headers: { "X-Agent-User-Id": userId },
      cache: "no-store",
    });
    if (res.status === 404) return null;
    if (!res.ok) return null;
    return (await res.json()) as AgentPersonalData;
  } catch {
    return null;
  }
}

export async function pushPersonalDataToRemote(
  userId: string,
  data: AgentPersonalData
): Promise<boolean> {
  try {
    const res = await fetch("/api/agent/data", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-Agent-User-Id": userId,
      },
      body: JSON.stringify(data),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** 앱 진입 시 로컬·서버 병합 후 캐시 */
export async function hydratePersonalData(): Promise<AgentPersonalData> {
  const userId = getOrCreateAgentUserId();
  const local = loadLocalPersonalData();
  const remote = await fetchRemotePersonalData(userId);
  const merged = mergePersonalData(local, remote);
  saveLocalPersonalData(merged);
  notifyHoldingsUpdated();
  void pushPersonalDataToRemote(userId, merged);
  return merged;
}

export function buildPersonalData(
  holdings: HoldingsSnapshot,
  chatMessages: StoredChatMessage[]
): AgentPersonalData {
  const updatedAt = new Date().toISOString();
  return {
    holdings: { ...holdings, updatedAt },
    chatMessages,
    updatedAt,
  };
}

/** 보유·채팅 변경 시 로컬 저장 + 서버 동기화 */
export async function persistPersonalData(data: AgentPersonalData): Promise<void> {
  const stamped = { ...data, updatedAt: new Date().toISOString() };
  stamped.holdings = { ...stamped.holdings, updatedAt: stamped.updatedAt };
  saveLocalPersonalData(stamped);
  notifyHoldingsUpdated();
  const userId = getOrCreateAgentUserId();
  await pushPersonalDataToRemote(userId, stamped);
}

export async function persistHoldingsWithSync(
  holdings: HoldingsSnapshot
): Promise<void> {
  const current = getPersonalDataFromLocal();
  await persistPersonalData({
    ...current,
    holdings: { ...holdings, updatedAt: new Date().toISOString() },
  });
}

export async function persistChatWithSync(
  chatMessages: StoredChatMessage[]
): Promise<void> {
  const current = getPersonalDataFromLocal();
  await persistPersonalData({ ...current, chatMessages });
}

/** 보유만 변경된 경우(채팅 명령 등) 개인 데이터 blob·클라우드 동기화 */
export function syncHoldingsToPersonal(holdings: HoldingsSnapshot): void {
  const current = getPersonalDataFromLocal();
  const data = buildPersonalData(holdings, current.chatMessages);
  saveLocalPersonalData(data);
  const userId = getOrCreateAgentUserId();
  void pushPersonalDataToRemote(userId, data);
}

export function getEmptyHoldings(): HoldingsSnapshot {
  return createEmptySnapshot();
}
