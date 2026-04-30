import { NextResponse } from "next/server";
import { getRedis, RESULT_KEY_PREFIX } from "@/lib/redis";
import type { PortfolioResult } from "@/types";

const ID_RE = /^[0-9a-zA-Z_-]{8,128}$/;

function isPortfolioResult(v: unknown): v is PortfolioResult {
  if (!v || typeof v !== "object") return false;
  const r = v as Record<string, unknown>;
  return (
    typeof r.id === "string" &&
    ID_RE.test(r.id) &&
    typeof r.bundleId === "string" &&
    typeof r.bundleName === "string" &&
    typeof r.method === "string" &&
    Array.isArray(r.tickers) &&
    typeof r.weights === "object" &&
    typeof r.metrics === "object" &&
    Array.isArray(r.frontier)
  );
}

export async function POST(request: Request) {
  const redis = getRedis();
  if (!redis) {
    return NextResponse.json({ error: "Redis not configured" }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  if (!isPortfolioResult(body)) {
    return NextResponse.json({ error: "invalid result payload" }, { status: 400 });
  }

  const serialized = JSON.stringify(body);
  if (serialized.length > 2_000_000) {
    return NextResponse.json({ error: "payload too large" }, { status: 413 });
  }

  try {
    await redis.set(`${RESULT_KEY_PREFIX}${body.id}`, serialized);
  } catch (err) {
    return NextResponse.json(
      { error: "redis write failed", detail: String(err) },
      { status: 502 }
    );
  }

  return NextResponse.json({ id: body.id }, { status: 201 });
}
