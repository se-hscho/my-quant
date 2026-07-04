export const AGENT_KV_PREFIX = "agent:personal:";

export function agentPersonalKvKey(userId: string): string {
  return `${AGENT_KV_PREFIX}${userId}`;
}
