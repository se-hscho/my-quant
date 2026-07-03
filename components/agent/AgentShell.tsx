"use client";

import type { ReactNode } from "react";
import { AgentChatProvider } from "./AgentChatProvider";
import { AgentChatDock } from "./AgentChatDock";

export function AgentShell({ children }: { children: ReactNode }) {
  return (
    <AgentChatProvider>
      <div className="flex min-h-screen flex-col bg-background pb-28">
        <header className="border-b bg-card px-4 py-3">
          <h1 className="text-lg font-semibold">포트폴리오 에이전트</h1>
        </header>
        <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">{children}</main>
        <AgentChatDock />
      </div>
    </AgentChatProvider>
  );
}
