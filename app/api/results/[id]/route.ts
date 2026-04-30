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

export async function DELETE(
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

  try {
    await kv.del(`${RESULT_KEY_PREFIX}${id}`);
  } catch (err) {
    return NextResponse.json(
      { error: "kv delete failed", detail: String(err) },
      { status: 502 }
    );
  }

  // 멱등: 키가 없었어도 200으로 응답 — 클라이언트가 재시도/동시 삭제해도 안전.
  return NextResponse.json({ id }, { status: 200 });
}
