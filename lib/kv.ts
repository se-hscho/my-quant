import { createClient, type VercelKV } from "@vercel/kv";

let cached: VercelKV | null = null;

/**
 * Vercel KV(Upstash Redis) 클라이언트. 환경변수가 없으면 null을 반환해
 * 호출 측에서 503 등으로 graceful degrade 할 수 있게 한다.
 *
 * 지원 env (Vercel Marketplace 통합 시 자동 주입):
 * - KV_REST_API_URL, KV_REST_API_TOKEN
 * - 또는 UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN (alias)
 */
export function getKv(): VercelKV | null {
  if (cached) return cached;
  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const token =
    process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  cached = createClient({ url, token });
  return cached;
}

export const RESULT_KEY_PREFIX = "result:";
