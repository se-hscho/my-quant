import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { AgentHome } from "./AgentHome";

vi.mock("./AgentPersonalProvider", () => ({
  useAgentPersonal: () => ({ ready: true, data: null, refresh: async () => {} }),
}));

describe("AgentHome", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          totalKrw: 10_000_000,
          cashKrw: 0,
          holdingsKrw: 10_000_000,
          holdings: [],
          fx: { usdKrw: 1350, jpyKrw: 9.2 },
          warnings: [],
        }),
      })
    );
  });

  it("보유가 등록되면 요약과 보유 편집 링크가 표시된다", async () => {
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
    expect(screen.getByRole("link", { name: "보유 편집" })).toHaveAttribute(
      "href",
      "/agent/holdings"
    );
    expect(screen.getByText(/오늘 요약|오늘 포트폴리오 요약/)).toBeInTheDocument();
  });
});
