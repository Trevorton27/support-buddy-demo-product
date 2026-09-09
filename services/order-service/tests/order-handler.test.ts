import { describe, it, expect } from "vitest";
import { executeOrderQuery, getServiceHealth } from "../src/handlers/orderHandler";

describe("executeOrderQuery", () => {
  const config = { timeoutMs: 10000, maxRetries: 2 };

  it("should complete fast queries within timeout", async () => {
    const result = await executeOrderQuery(
      { customerId: "cust_001" },
      config,
      500
    );
    expect(result.timedOut).toBe(false);
    expect(result.orders).toHaveLength(1);
  });

  it("should respect the configured timeout of 10000ms", async () => {
    // This test FAILS — the hardcoded 3000ms timeout kills queries
    // that should be within the configured 10000ms limit
    const result = await executeOrderQuery(
      { customerId: "cust_001", limit: 10000 },
      config,
      5000 // 5 seconds — within 10s config, but exceeds hardcoded 3s
    );
    expect(result.timedOut).toBe(false);
    expect(result.orders).toHaveLength(1);
  });

  it("should time out queries exceeding configured timeout", async () => {
    const result = await executeOrderQuery(
      { customerId: "cust_001" },
      config,
      15000 // 15 seconds — exceeds configured 10s
    );
    expect(result.timedOut).toBe(true);
  });
});

describe("getServiceHealth", () => {
  it("should report configuration mismatch", () => {
    const health = getServiceHealth({ timeoutMs: 10000, maxRetries: 2 });
    // The service knows about the mismatch but doesn't fix it
    expect(health.mismatch).toBe(true);
    expect(health.configuredTimeoutMs).toBe(10000);
    expect(health.effectiveTimeoutMs).toBe(3000);
  });
});
