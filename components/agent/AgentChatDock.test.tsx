import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AgentShell } from "./AgentShell";
import { loadHoldingsSnapshot } from "@/lib/agent/holdings-storage";

describe("AgentChatDock", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(async (_url, init) => {
        const body = JSON.parse((init as RequestInit).body as string);
        if (body.message.includes("SOXX")) {
          return {
            ok: true,
            json: async () => ({
              reply: "SOXX 10을 등록했습니다. (참고용)",
              actions: [
                {
                  type: "add_holding",
                  ticker: "SOXX",
                  quantity: 10,
                  assetType: "etf",
                  currency: "USD",
                },
              ],
            }),
          };
        }
        return {
          ok: true,
          json: async () => ({
            reply: "안내입니다. (참고용)",
            actions: [],
          }),
        };
      })
    );
  });

  it("채팅 입력창과 전송 UI가 하단에 있다", () => {
    render(
      <AgentShell>
        <div>content</div>
      </AgentShell>
    );
    expect(screen.getByTestId("agent-chat-dock")).toBeInTheDocument();
    expect(screen.getByLabelText("에이전트에게 질문")).toBeInTheDocument();
    expect(screen.getByLabelText("질문 보내기")).toBeInTheDocument();
  });

  it("질문 전송 후 에이전트 답변이 표시된다", async () => {
    const user = userEvent.setup();
    render(
      <AgentShell>
        <div>content</div>
      </AgentShell>
    );

    await user.type(
      screen.getByLabelText("에이전트에게 질문"),
      "SOXX 10주 등록"
    );
    await user.click(screen.getByLabelText("질문 보내기"));

    await waitFor(() => {
      expect(screen.getByText(/SOXX 10을 등록했습니다/)).toBeInTheDocument();
    });
    expect(loadHoldingsSnapshot()?.holdings[0]?.ticker).toBe("SOXX");
  });
});
