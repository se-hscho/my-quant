import { describe, it, expect } from "vitest";
import { parseChatActionsFromLlm } from "./chat-action-utils";

describe("parseChatActionsFromLlm", () => {
  it("add_holding action을 파싱한다", () => {
    const actions = parseChatActionsFromLlm([
      {
        type: "add_holding",
        ticker: "soxx",
        quantity: 10,
        assetType: "etf",
        currency: "USD",
      },
    ]);
    expect(actions[0]).toEqual({
      type: "add_holding",
      ticker: "SOXX",
      quantity: 10,
      assetType: "etf",
      currency: "USD",
    });
  });

  it("잘못된 action은 무시한다", () => {
    expect(parseChatActionsFromLlm([{ type: "add_holding", ticker: "" }])).toHaveLength(0);
  });
});
