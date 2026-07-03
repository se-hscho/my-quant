"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { AgentPersonalProvider } from "./AgentPersonalProvider";
import { AgentChatProvider } from "./AgentChatProvider";
import { AgentChatDock } from "./AgentChatDock";
import { Button } from "@/components/ui/button";

export function AgentShell({ children }: { children: ReactNode }) {
  return (
    <AgentPersonalProvider>
      <AgentChatProvider>
        <div className="flex min-h-screen flex-col bg-background pb-28">
          <header className="border-b bg-card px-4 py-3">
            <div className="flex items-center justify-between gap-2">
              <h1 className="text-lg font-semibold">
                <Link href="/agent" className="hover:underline">
                  포트폴리오 에이전트
                </Link>
              </h1>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href="/agent/holdings">보유 편집</Link>
                </Button>
                <span className="hidden text-[10px] text-muted-foreground sm:inline">
                  개인 데이터 클라우드 동기화
                </span>
              </div>
            </div>
          </header>
          <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">{children}</main>
          <AgentChatDock />
        </div>
      </AgentChatProvider>
    </AgentPersonalProvider>
  );
}
