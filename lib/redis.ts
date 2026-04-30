import { Redis } from "@upstash/redis";

let cached: Redis | null = null;

/**
 * Upstash Redis 클라이언트. 환경변수가 없으면 null을 반환해 호출 측에서
 * 503 등으로 graceful degrade 할 수 있게 한다.
 *
 * `Redis.fromEnv()`는 다음 env를 자동으로 읽는다 (Vercel Marketplace 통합 시 자동 주입):
 * - UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN
 * - 또는 (구) KV_REST_API_URL, KV_REST_API_TOKEN
 */
export function getRedis(): Redis | null {
  if (cached) return cached;
  const url =
    process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  cached = new Redis({ url, token });
  return cached;
}

export const RESULT_KEY_PREFIX = "result:";
