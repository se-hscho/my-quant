import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "포트폴리오 에이전트",
  description: "개인 포트폴리오 관리 에이전트 — 일일 브리핑·리밸런싱 검토",
};

export default function AgentLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card px-4 py-3">
        <h1 className="text-lg font-semibold">포트폴리오 에이전트</h1>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-8">{children}</main>
    </div>
  );
}
