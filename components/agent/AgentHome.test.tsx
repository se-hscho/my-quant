import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { AgentHome } from "./AgentHome";

vi.mock("./AgentPersonalProvider", () => ({
  useAgentPersonal: () => ({ ready: true, data: null, refresh: async () => {} }),
}));

describe("AgentHome", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("보유가 등록된 경우에도 보유 편집 링크가 표시된다", () => {
    localStorage.setItem(
      "agent:holdings:v1",
      JSON.stringify({
        holdings: [
          {
            id: "1",
            ticker: "SOXX",
            quantity: 10,
            assetType: "etf",
            currency: "USD",
          },
        ],
        cash: { krw: 0, usd: 0, jpy: 0 },
        updatedAt: new Date().toISOString(),
      })
    );

    render(<AgentHome />);
    expect(screen.getByRole("link", { name: "보유 자산 편집" })).toHaveAttribute(
      "href",
      "/agent/holdings"
    );
  });
});
