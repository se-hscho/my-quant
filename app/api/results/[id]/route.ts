import { NextResponse } from "next/server";
import { getKv, RESULT_KEY_PREFIX } from "@/lib/kv";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!/^[0-9a-zA-Z_-]{8,128}$/.test(id)) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }

  const kv = getKv();
  if (!kv) {
    return NextResponse.json({ error: "KV not configured" }, { status: 503 });
  }

  let raw: unknown;
  try {
    raw = await kv.get(`${RESULT_KEY_PREFIX}${id}`);
  } catch (err) {
    return NextResponse.json(
      { error: "kv read failed", detail: String(err) },
      { status: 502 }
    );
  }

  if (raw == null) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const result = typeof raw === "string" ? JSON.parse(raw) : raw;
  return NextResponse.json(result);
}
