import { getKv } from "@/lib/kv";
import { agentPersonalKvKey } from "@/lib/agent/kv-keys";
import type { AgentPersonalData } from "@/types/agent-personal";
import {
  emptyPersonalData,
  isAgentPersonalData,
  isAgentUserId,
} from "@/services/agent/personal-data";

export async function loadPersonalDataFromKv(
  userId: string
): Promise<AgentPersonalData | null> {
  if (!isAgentUserId(userId)) return null;
  const kv = getKv();
  if (!kv) return null;

  try {
    const raw = await kv.get<string>(agentPersonalKvKey(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    return isAgentPersonalData(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export async function savePersonalDataToKv(
  userId: string,
  data: AgentPersonalData
): Promise<boolean> {
  if (!isAgentUserId(userId)) return false;
  const kv = getKv();
  if (!kv) return false;

  const serialized = JSON.stringify(data);
  if (serialized.length > 1_000_000) return false;

  try {
    await kv.set(agentPersonalKvKey(userId), serialized);
    return true;
  } catch {
    return false;
  }
}

export function validatePersonalDataPayload(
  userId: string,
  body: unknown
): AgentPersonalData | null {
  if (!isAgentUserId(userId)) return null;
  if (!isAgentPersonalData(body)) return null;
  return body;
}

export { emptyPersonalData };
