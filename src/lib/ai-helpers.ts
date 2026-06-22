/**
 * Shared AI helpers for the cabinet-shop site (mirrors the restaurant app).
 * - Per-key AI rate limiter (default 20 calls/hour).
 */

interface RateBucket {
  count: number;
  resetAt: number;
}
const aiBuckets = new Map<string, RateBucket>();
const AI_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const AI_MAX_CALLS = parseInt(process.env.AI_RATE_LIMIT_PER_HOUR || "20", 10);

export interface AiRateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

/** Check + increment the per-key AI rate budget. */
export function aiRateLimiter(userKey: string): AiRateLimitResult {
  const now = Date.now();
  const b = aiBuckets.get(userKey);
  if (!b || now > b.resetAt) {
    aiBuckets.set(userKey, { count: 1, resetAt: now + AI_WINDOW_MS });
    return { allowed: true, remaining: AI_MAX_CALLS - 1, resetAt: now + AI_WINDOW_MS };
  }
  if (b.count >= AI_MAX_CALLS) {
    return { allowed: false, remaining: 0, resetAt: b.resetAt };
  }
  b.count++;
  return { allowed: true, remaining: AI_MAX_CALLS - b.count, resetAt: b.resetAt };
}
