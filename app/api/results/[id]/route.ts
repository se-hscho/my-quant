import { NextResponse } from "next/server";
import { getRedis, RESULT_KEY_PREFIX } from "@/lib/redis";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!/^[0-9a-zA-Z_-]{8,128}$/.test(id)) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }

  const redis = getRedis();
  if (!redis) {
    return NextResponse.json({ error: "Redis not configured" }, { status: 503 });
  }

  let raw: unknown;
  try {
    raw = await redis.get(`${RESULT_KEY_PREFIX}${id}`);
  } catch (err) {
    return NextResponse.json(
      { error: "redis read failed", detail: String(err) },
      { status: 502 }
    );
  }

  if (raw == null) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  // @upstash/redis는 JSON-encoded 문자열을 자동으로 parse 해서 객체로 돌려줄 수 있고,
  // raw string 그대로 올 수도 있다. 양쪽 모두 처리.
  const result = typeof raw === "string" ? JSON.parse(raw) : raw;
  return NextResponse.json(result);
}
