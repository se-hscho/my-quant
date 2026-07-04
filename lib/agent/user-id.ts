import { AGENT_USER_ID_KEY } from "@/types/agent-personal";

export function getOrCreateAgentUserId(): string {
  if (typeof localStorage === "undefined") {
    return "00000000-0000-4000-8000-000000000000";
  }
  const existing = localStorage.getItem(AGENT_USER_ID_KEY);
  if (existing) return existing;
  const id = crypto.randomUUID();
  localStorage.setItem(AGENT_USER_ID_KEY, id);
  return id;
}
