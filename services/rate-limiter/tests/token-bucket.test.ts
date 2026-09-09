import { describe, it, expect, beforeEach } from "vitest";
import { consumeToken, _resetBuckets } from "../src/tokenBucket";

beforeEach(() => {
  _resetBuckets();
});

const FREE_TIER = {
  maxRequests: 1000,
  windowMs: 3600000, // 1 hour
  burstMultiplier: 5,
  burstWindowMs: 100, // 100ms
};

describe("consumeToken", () => {
  it("should allow requests within limit", () => {
    const result = consumeToken("client_1", FREE_TIER);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(999);
  });

  it("should correctly count sequential requests outside burst window", () => {
    const baseTime = Date.now();
    // Requests spaced 200ms apart — outside 100ms burst window
    for (let i = 0; i < 10; i++) {
      consumeToken("client_2", FREE_TIER, baseTime + i * 200);
    }
    const result = consumeToken("client_2", FREE_TIER, baseTime + 2200);
    expect(result.remaining).toBe(989); // 1000 - 11
    expect(result.allowed).toBe(true);
  });

  it("should not over-count burst requests", () => {
    // This test FAILS due to the burst multiplier bug
    // 5 rapid requests within 100ms burst window should cost 5 tokens,
    // not 5 * burstMultiplier = 25 tokens
    const baseTime = Date.now();
    for (let i = 0; i < 5; i++) {
      consumeToken("client_3", FREE_TIER, baseTime + i * 10); // 10ms apart
    }
    const result = consumeToken("client_3", FREE_TIER, baseTime + 200);
    // Should have 1000 - 6 = 994 remaining, not much less
    expect(result.remaining).toBeGreaterThan(980);
  });

  it("should reject when limit exhausted", () => {
    const config = { ...FREE_TIER, maxRequests: 2 };
    consumeToken("client_4", config);
    consumeToken("client_4", config, Date.now() + 200);
    const result = consumeToken("client_4", config, Date.now() + 400);
    expect(result.allowed).toBe(false);
  });
});
