import { describe, it, expect } from "vitest";
import {
  emptyPersonalData,
  mergePersonalData,
} from "@/services/agent/personal-data";
import { createEmptySnapshot } from "@/lib/agent/holdings-storage";

describe("mergePersonalData", () => {
  it("remote가 더 최신이면 remote를 선택한다", () => {
    const local = emptyPersonalData();
    local.holdings.holdings = [
      {
        id: "1",
        ticker: "OLD",
        quantity: 1,
        assetType: "stock",
        currency: "USD",
      },
    ];
    local.updatedAt = "2026-01-01T00:00:00.000Z";

    const remote = emptyPersonalData();
    remote.holdings.holdings = [
      {
        id: "2",
        ticker: "NEW",
        quantity: 2,
        assetType: "etf",
        currency: "USD",
      },
    ];
    remote.updatedAt = "2026-07-03T00:00:00.000Z";

    const merged = mergePersonalData(local, remote);
    expect(merged.holdings.holdings[0]?.ticker).toBe("NEW");
  });

  it("local만 있으면 local을 반환한다", () => {
    const local = emptyPersonalData();
    local.chatMessages.push({ id: "m1", role: "user", content: "hi" });
    expect(mergePersonalData(local, null).chatMessages).toHaveLength(1);
  });
});
