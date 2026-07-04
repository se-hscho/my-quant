/** 무료 Gemini tier 보호 — 프로세스당 슬라이딩 윈도우 */
const WINDOW_MS = 60_000;
const MAX_CALLS_PER_WINDOW = Number(process.env.GEMINI_MAX_CALLS_PER_MIN ?? 8);

const timestamps: number[] = [];

export function getLlmRateLimitStatus(): {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
} {
  const now = Date.now();
  while (timestamps.length > 0 && now - timestamps[0] > WINDOW_MS) {
    timestamps.shift();
  }
  const remaining = Math.max(0, MAX_CALLS_PER_WINDOW - timestamps.length);
  const retryAfterMs =
    timestamps.length >= MAX_CALLS_PER_WINDOW
      ? WINDOW_MS - (now - timestamps[0])
      : 0;
  return {
    allowed: remaining > 0,
    remaining,
    retryAfterMs,
  };
}

export function recordLlmCall(): void {
  timestamps.push(Date.now());
}

export function canInvokeLlm(): boolean {
  return getLlmRateLimitStatus().allowed;
}
