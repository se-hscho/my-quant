import type { Metadata } from "next";
import { AgentShell } from "@/components/agent/AgentShell";

export const metadata: Metadata = {
  title: "포트폴리오 에이전트",
  description: "개인 포트폴리오 관리 에이전트 — 일일 브리핑·리밸런싱 검토",
};

export default function AgentLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <AgentShell>{children}</AgentShell>;
}
