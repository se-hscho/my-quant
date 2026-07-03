import { expect, type APIRequestContext } from "@playwright/test";

export const REGISTER_REPLY = /등록했습니다|반영했습니다/;

export type ChatApiBody = {
  reply: string;
  actions: Array<{
    type: string;
    ticker?: string;
    quantity?: number;
    field?: string;
    amount?: number;
  }>;
  llmStatus?: string;
  usedLlm?: boolean;
};

export async function postAgentChat(
  request: APIRequestContext,
  message: string,
  snapshot: unknown = null
): Promise<ChatApiBody> {
  const res = await request.post("/api/agent/chat", {
    data: { message, snapshot },
  });
  expect(res.ok()).toBeTruthy();
  return res.json() as Promise<ChatApiBody>;
}

export function expectAddHolding(
  body: ChatApiBody,
  expected: { ticker: string; quantity: number }
) {
  expect(body.actions[0]).toMatchObject({
    type: "add_holding",
    ticker: expected.ticker,
    quantity: expected.quantity,
  });
  expect(body.reply).toMatch(REGISTER_REPLY);
  expect(body.reply).not.toMatch(/명령을 이해하지 못했습니다/);
}

export function expectSetCash(
  body: ChatApiBody,
  expected: { field: string; amount: number }
) {
  expect(body.actions[0]).toMatchObject({
    type: "set_cash",
    field: expected.field,
    amount: expected.amount,
  });
  expect(body.reply).toMatch(REGISTER_REPLY);
}
