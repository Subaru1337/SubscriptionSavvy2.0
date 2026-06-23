/**
 * In-memory rate limiter with automatic cleanup.
 * 
 * ⚠️  NOTE: On Vercel serverless, each function instance has its own memory.
 *    This provides basic protection but is NOT distributed. For production-grade
 *    rate limiting, migrate to Upstash Redis (@upstash/ratelimit).
 * 
 *    This is still valuable because:
 *    1. Vercel reuses warm instances for ~15 minutes, so it catches rapid bursts
 *    2. It prevents abuse from a single connection/IP within a warm instance
 *    3. It's zero-dependency and zero-cost
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Cleanup stale entries every 5 minutes to prevent memory leaks
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let cleanupTimer: ReturnType<typeof setInterval> | null = null;

function ensureCleanup() {
  if (cleanupTimer) return;
  cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (now > entry.resetAt) {
        store.delete(key);
      }
    }
    // If store is empty, stop the cleanup interval
    if (store.size === 0 && cleanupTimer) {
      clearInterval(cleanupTimer);
      cleanupTimer = null;
    }
  }, CLEANUP_INTERVAL);
  // Don't let the timer prevent Node from exiting
  if (cleanupTimer && typeof cleanupTimer === "object" && "unref" in cleanupTimer) {
    (cleanupTimer as any).unref();
  }
}

/**
 * Check if a request should be rate-limited.
 * 
 * @param key     - Unique identifier (e.g., IP + route prefix)
 * @param limit   - Max requests allowed in the window
 * @param windowMs - Time window in milliseconds
 * @returns { allowed, remaining, resetAt } 
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number = 60_000
): { allowed: boolean; remaining: number; resetAt: number } {
  ensureCleanup();

  const now = Date.now();
  const entry = store.get(key);

  // First request or window expired — reset
  if (!entry || now > entry.resetAt) {
    const resetAt = now + windowMs;
    store.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: limit - 1, resetAt };
  }

  // Within window — check count
  if (entry.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  return { allowed: true, remaining: limit - entry.count, resetAt: entry.resetAt };
}

/**
 * Predefined rate limit tiers for different route types.
 */
export const RATE_LIMITS = {
  /** Auth endpoints (login, register) — strict: 10 req/min */
  AUTH: { limit: 10, windowMs: 60_000 },
  /** Write operations (POST, PUT, DELETE) — moderate: 30 req/min */
  WRITE: { limit: 30, windowMs: 60_000 },
  /** Read operations (GET) — relaxed: 60 req/min */
  READ: { limit: 60, windowMs: 60_000 },
  /** Export operations (CSV, PDF) — strict: 10 req/min */
  EXPORT: { limit: 10, windowMs: 60_000 },
  /** Cron endpoint — very strict: 5 req/min */
  CRON: { limit: 5, windowMs: 60_000 },
} as const;
