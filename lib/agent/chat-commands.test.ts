import { describe, it, expect } from "vitest";
import { parseChatCommand } from "./chat-commands";
import { createEmptySnapshot } from "./holdings-storage";

describe("parseChatCommand", () => {
  it("SOXX 10주 등록 → add_holding", () => {
    const r = parseChatCommand({ message: "SOXX 10주 등록" });
    expect(r.actions).toHaveLength(1);
    expect(r.actions[0]).toMatchObject({
      type: "add_holding",
      ticker: "SOXX",
      quantity: 10,
      currency: "USD",
    });
    expect(r.reply).toMatch(/SOXX/);
  });

  it("자산 005930.KS 50주 등록 → KRW 주식", () => {
    const r = parseChatCommand({ message: "자산 005930.KS 50주 등록" });
    expect(r.actions[0]).toMatchObject({
      type: "add_holding",
      ticker: "005930.KS",
      quantity: 50,
      assetType: "stock",
      currency: "KRW",
    });
  });

  it("AAPL 10 etf usd 등록", () => {
    const r = parseChatCommand({ message: "AAPL 10 etf usd 등록" });
    expect(r.actions[0]).toMatchObject({
      type: "add_holding",
      ticker: "AAPL",
      quantity: 10,
      assetType: "etf",
      currency: "USD",
    });
  });

  it("KRW 현금 5000만 등록 → set_cash", () => {
    const r = parseChatCommand({ message: "KRW 현금 5000만 등록" });
    expect(r.actions[0]).toEqual({
      type: "set_cash",
      field: "krw",
      amount: 50_000_000,
    });
  });

  it("usd 현금 12000 추가", () => {
    const r = parseChatCommand({ message: "usd 현금 12000 추가" });
    expect(r.actions[0]).toEqual({
      type: "set_cash",
      field: "usd",
      amount: 12_000,
    });
  });

  it("보유 목록 → 스냅샷 요약 reply", () => {
    const snap = createEmptySnapshot();
    snap.holdings.push({
      id: "1",
      ticker: "SOXX",
      quantity: 10,
      assetType: "etf",
      currency: "USD",
    });
    snap.cash.krw = 1_000_000;
    const r = parseChatCommand({ message: "보유 목록 보여줘", snapshot: snap });
    expect(r.actions).toHaveLength(0);
    expect(r.reply).toMatch(/SOXX/);
    expect(r.reply).toMatch(/1,000,000|100만/);
  });

  it("SOXX 삭제 → remove_holding", () => {
    const r = parseChatCommand({ message: "SOXX 삭제" });
    expect(r.actions[0]).toEqual({ type: "remove_holding", ticker: "SOXX" });
  });

  it("도움말 → 명령 예시", () => {
    const r = parseChatCommand({ message: "도움말" });
    expect(r.actions).toHaveLength(0);
    expect(r.reply).toMatch(/등록/);
  });
});
