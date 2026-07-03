import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AgentShell } from "./AgentShell";

describe("AgentChatDock", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          reply: "안 2(선점) 검토안 요약입니다. (참고용)",
        }),
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
      "안 2만 자세히 설명해줘"
    );
    await user.click(screen.getByLabelText("질문 보내기"));

    await waitFor(() => {
      expect(screen.getByText(/안 2\(선점\) 검토안 요약입니다/)).toBeInTheDocument();
    });
  });
});
