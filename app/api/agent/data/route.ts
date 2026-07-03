import { NextResponse } from "next/server";
import {
  loadPersonalDataFromKv,
  savePersonalDataToKv,
  validatePersonalDataPayload,
} from "@/services/agent/personal-kv";
import { isAgentUserId } from "@/services/agent/personal-data";

function userIdFromRequest(request: Request): string | null {
  const header = request.headers.get("x-agent-user-id");
  if (header && isAgentUserId(header)) return header;
  return null;
}

export async function GET(request: Request) {
  const userId = userIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ error: "invalid user id" }, { status: 400 });
  }

  const data = await loadPersonalDataFromKv(userId);
  if (!data) {
    return new NextResponse(null, { status: 404 });
  }
  return NextResponse.json(data);
}

export async function PUT(request: Request) {
  const userId = userIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ error: "invalid user id" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const data = validatePersonalDataPayload(userId, body);
  if (!data) {
    return NextResponse.json({ error: "invalid payload" }, { status: 400 });
  }

  const ok = await savePersonalDataToKv(userId, data);
  if (!ok) {
    return NextResponse.json({ error: "KV not configured or write failed" }, { status: 503 });
  }

  return NextResponse.json({ ok: true, updatedAt: data.updatedAt });
}
