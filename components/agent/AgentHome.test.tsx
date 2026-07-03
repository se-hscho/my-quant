import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { AgentHome } from "./AgentHome";

vi.mock("./AgentPersonalProvider", () => ({
  useAgentPersonal: () => ({ ready: true, data: null, refresh: async () => {} }),
}));

const mockBriefing = {
  date: "2026-07-03",
  summaryLines: ["결론 1", "결론 2", "결론 3"],
  totalAssetsKrw: 10_000_000,
  cash: { krw: 0, usd: 0, jpy: 0 },
  sectorTop3: [{ sector: "semiconductor", label: "반도체", weightPct: 100, flowScore: 0.8 }],
  scenarioComparison: [
    { id: 0, label: "유지", expectedReturn: 5, expectedVolatility: 12 },
    { id: 1, label: "Follow", expectedReturn: 6, expectedVolatility: 14 },
    { id: 2, label: "선점", expectedReturn: 8, expectedVolatility: 17 },
    { id: 3, label: "최소변경", expectedReturn: 5, expectedVolatility: 13 },
  ],
  fxRebalanceLine: "환전 검토",
  scenarios: [],
  sections: {} as never,
  disclaimer: "참고용",
  status: "complete",
};

describe("AgentHome", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(async (url: string) => {
        if (url.includes("/api/agent/briefing")) {
          return {
            ok: true,
            json: async () => ({ briefing: mockBriefing, dates: [mockBriefing.date] }),
          };
        }
        return {
          ok: true,
          json: async () => ({
            totalKrw: 10_000_000,
            cashKrw: 0,
            holdingsKrw: 10_000_000,
            holdings: [],
            fx: { usdKrw: 1350, jpyKrw: 9.2 },
            warnings: [],
          }),
        };
      })
    );
  });

  it("보유가 등록되면 요약과 상세 링크가 표시된다", async () => {
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
    await waitFor(() => {
      expect(screen.getByTestId("summary-page")).toBeInTheDocument();
    });
    expect(screen.getByRole("link", { name: "상세 레포트 보기" })).toHaveAttribute(
      "href",
      "/agent/report/2026-07-03"
    );
  });
});
