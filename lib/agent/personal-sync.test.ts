import { describe, expect, it, vi, beforeEach } from "vitest";
import { mergePersonalData } from "@/services/agent/personal-data";
import type { AgentPersonalData } from "@/types/agent-personal";

describe("mergePersonalData", () => {
  it("더 최신 updatedAt을 가진 쪽을 채택한다", () => {
    const local: AgentPersonalData = {
      holdings: {
        holdings: [
          {
            id: "1",
            ticker: "SOXX",
            quantity: 5,
            assetType: "etf",
            currency: "USD",
          },
        ],
        cash: { krw: 0, usd: 0, jpy: 0 },
        updatedAt: "2026-07-01T00:00:00.000Z",
      },
      chatMessages: [{ id: "1", role: "user", content: "hi" }],
      updatedAt: "2026-07-01T00:00:00.000Z",
    };
    const remote: AgentPersonalData = {
      holdings: {
        holdings: [
          {
            id: "2",
            ticker: "SOXX",
            quantity: 10,
            assetType: "etf",
            currency: "USD",
          },
        ],
        cash: { krw: 1000, usd: 0, jpy: 0 },
        updatedAt: "2026-07-03T00:00:00.000Z",
      },
      chatMessages: [],
      updatedAt: "2026-07-03T00:00:00.000Z",
    };

    const merged = mergePersonalData(local, remote);
    expect(merged.holdings.holdings[0]?.quantity).toBe(10);
    expect(merged.holdings.cash.krw).toBe(1000);
    expect(merged.chatMessages).toHaveLength(0);
  });
});

describe("getOrCreateAgentUserId", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", {
      store: {} as Record<string, string>,
      getItem(key: string) {
        return this.store[key] ?? null;
      },
      setItem(key: string, value: string) {
        this.store[key] = value;
      },
    });
  });

  it("처음 호출 시 UUID를 생성하고 재사용한다", async () => {
    const { getOrCreateAgentUserId } = await import("@/lib/agent/user-id");
    const id1 = getOrCreateAgentUserId();
    const id2 = getOrCreateAgentUserId();
    expect(id1).toBe(id2);
    expect(id1.length).toBeGreaterThan(10);
  });
});
