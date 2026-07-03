import { NextResponse } from "next/server";
import type { HoldingsSnapshot } from "@/types/agent";
import { parseChatCommand } from "@/lib/agent/chat-commands";

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

  const { reply, actions } = parseChatCommand({ message, snapshot });

  return NextResponse.json({ reply, actions });
}
