import { NextResponse } from "next/server";
import type { HoldingsSnapshot } from "@/types/agent";
import { processAgentChat } from "@/services/agent/chat-orchestrator";
import { getBriefing } from "@/services/briefing/kv";

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

  const today = new Date().toISOString().slice(0, 10);
  const briefing = await getBriefing(today);

  const { reply, actions, normalizedCommand, usedLlm, llmStatus } =
    await processAgentChat({
      message,
      snapshot,
      briefing,
    });

  return NextResponse.json({ reply, actions, normalizedCommand, usedLlm, llmStatus });
}
