import { describe, it, expect } from "vitest";
import { calculatePoolSize } from "../src/poolCalculator";

describe("pool scaling regression", () => {
  it("should reduce pool size when scaling to 20 instances", () => {
    const result = calculatePoolSize({
      maxDbConnections: 100,
      defaultPoolSize: 25,
      instanceCount: 20,
      reservedConnections: 5,
    });
    expect(result.withinLimit).toBe(true);
    expect(result.totalConnections).toBeLessThanOrEqual(100);
  });
});