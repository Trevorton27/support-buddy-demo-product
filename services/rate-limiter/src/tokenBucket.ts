export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  burstMultiplier: number;
  burstWindowMs: number;
}

export interface BucketState {
  tokens: number;
  lastRefill: number;
  burstCount: number;
  burstWindowStart: number;
}

const buckets = new Map<string, BucketState>();

export function getBucketState(clientId: string, config: RateLimitConfig): BucketState {
  if (!buckets.has(clientId)) {
    buckets.set(clientId, {
      tokens: config.maxRequests,
      lastRefill: Date.now(),
      burstCount: 0,
      burstWindowStart: Date.now(),
    });
  }
  return buckets.get(clientId)!;
}

/**
 * Attempts to consume a token from the rate limiter.
 *
 * BUG: The burst counter has a race condition. When multiple requests
 * arrive within the same burstWindowMs, the counter reads the current
 * burstCount, increments it, and writes back — but the increment is
 * applied BEFORE checking if we're still in the burst window, causing
 * the burstCount to be multiplied by the burstMultiplier incorrectly.
 *
 * This causes free-tier users (1000 req/hour) to hit rate limits at
 * ~200 actual requests.
 */
export function consumeToken(
  clientId: string,
  config: RateLimitConfig,
  now: number = Date.now()
): { allowed: boolean; remaining: number; retryAfterMs?: number } {
  const state = getBucketState(clientId, config);

  // Refill tokens based on elapsed time
  const elapsed = now - state.lastRefill;
  if (elapsed >= config.windowMs) {
    state.tokens = config.maxRequests;
    state.lastRefill = now;
    state.burstCount = 0;
    state.burstWindowStart = now;
  }

  // BUG: Burst detection double-counts
  // The burstCount is incremented unconditionally, then multiplied
  const inBurstWindow = (now - state.burstWindowStart) < config.burstWindowMs;

  if (inBurstWindow) {
    state.burstCount++;
    // BUG: Each request in a burst window costs burstMultiplier tokens
    // instead of 1 token. Should only apply multiplier to the burst
    // EXCESS, not every request in the window.
    const cost = state.burstCount > 1 ? config.burstMultiplier : 1;
    state.tokens -= cost;
  } else {
    state.burstWindowStart = now;
    state.burstCount = 1;
    state.tokens -= 1;
  }

  if (state.tokens <= 0) {
    const retryAfterMs = config.windowMs - (now - state.lastRefill);
    return { allowed: false, remaining: 0, retryAfterMs };
  }

  return { allowed: true, remaining: state.tokens };
}

export function _resetBuckets(): void {
  buckets.clear();
}
