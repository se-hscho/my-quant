import { NextResponse } from "next/server";
import type { HoldingsSnapshot } from "@/types/agent";
import { DEMO_PORTFOLIO_SNAPSHOT } from "@/lib/agent/demo-portfolio";
import { processAgentChat } from "@/services/agent/chat-orchestrator";
import { generateBriefing } from "@/services/briefing/generate";
import { getBriefing, saveBriefing } from "@/services/briefing/kv";

function hasPortfolioData(snapshot: HoldingsSnapshot | null | undefined): boolean {
  if (!snapshot) return false;
  return (
    snapshot.holdings.length > 0 ||
    snapshot.cash.krw > 0 ||
    snapshot.cash.usd > 0 ||
    snapshot.cash.jpy > 0
  );
}

async function resolveBriefingForChat(snapshot: HoldingsSnapshot | null | undefined) {
  const today = new Date().toISOString().slice(0, 10);
  let briefing = await getBriefing(today);
  if (briefing?.status === "complete") return briefing;

  const useDemo = !hasPortfolioData(snapshot);
  if (!useDemo && !snapshot) return null;

  const targetSnapshot = useDemo ? DEMO_PORTFOLIO_SNAPSHOT : snapshot!;

  try {
    briefing = await generateBriefing({
      snapshot: targetSnapshot,
      allowDemoFallback: useDemo,
    });
    await saveBriefing(briefing);
    return briefing;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  let message = "";
  let snapshot: HoldingsSnapshot | null | undefined;

  try {
    const body = (await request.json()) as {
      message?: string;
      snapshot?: HoldingsSnapshot | null;
    };
    message = body.message?.trim() ?? "";
    snapshot = body.snapshot;
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  if (!message) {
    return NextResponse.json({ error: "message required" }, { status: 400 });
  }

  const briefing = await resolveBriefingForChat(snapshot);

  const { reply, actions, normalizedCommand, usedLlm, llmStatus } =
    await processAgentChat({
      message,
      snapshot,
      briefing,
    });

  return NextResponse.json({ reply, actions, normalizedCommand, usedLlm, llmStatus });
}
