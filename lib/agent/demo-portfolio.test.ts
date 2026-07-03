import { describe, expect, it } from "vitest";
import { DEMO_PORTFOLIO_SNAPSHOT } from "./demo-portfolio";

describe("DEMO_PORTFOLIO_SNAPSHOT", () => {
  it("예시 보유 3종목과 현금을 포함한다", () => {
    expect(DEMO_PORTFOLIO_SNAPSHOT.holdings).toHaveLength(3);
    expect(DEMO_PORTFOLIO_SNAPSHOT.cash.krw).toBeGreaterThan(0);
    expect(DEMO_PORTFOLIO_SNAPSHOT.cash.usd).toBeGreaterThan(0);
  });
});
