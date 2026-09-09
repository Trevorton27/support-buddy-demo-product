import { describe, it, expect } from "vitest";
import { calculatePoolSize, validatePoolHealth } from "../src/poolCalculator";

describe("calculatePoolSize", () => {
  it("should work with a single instance", () => {
    const result = calculatePoolSize({
      maxDbConnections: 100,
      defaultPoolSize: 25,
      instanceCount: 1,
      reservedConnections: 5,
    });
    expect(result.withinLimit).toBe(true);
    expect(result.perInstancePoolSize).toBeLessThanOrEqual(95);
  });

  it("should reduce pool size when scaling to many instances", () => {
    // This test FAILS — the bug returns 25 per instance = 500 total
    const result = calculatePoolSize({
      maxDbConnections: 100,
      defaultPoolSize: 25,
      instanceCount: 20,
      reservedConnections: 5,
    });
    // With 20 instances, each should get (100-5)/20 = ~4 connections
    expect(result.withinLimit).toBe(true);
    expect(result.perInstancePoolSize).toBeLessThanOrEqual(5);
    expect(result.totalConnections).toBeLessThanOrEqual(100);
  });

  it("should account for reserved connections", () => {
    const result = calculatePoolSize({
      maxDbConnections: 100,
      defaultPoolSize: 25,
      instanceCount: 10,
      reservedConnections: 10,
    });
    // (100-10)/10 = 9 per instance
    expect(result.perInstancePoolSize).toBeLessThanOrEqual(9);
    expect(result.totalConnections).toBeLessThanOrEqual(90);
  });
});

describe("validatePoolHealth", () => {
  it("should report healthy when under limit", () => {
    const result = validatePoolHealth(50, 100);
    expect(result.healthy).toBe(true);
    expect(result.utilizationPct).toBe(50);
  });

  it("should report unhealthy at capacity", () => {
    const result = validatePoolHealth(100, 100);
    expect(result.healthy).toBe(false);
    expect(result.error).toBe("too many connections");
  });
});
