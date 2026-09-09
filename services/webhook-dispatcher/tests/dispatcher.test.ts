import { describe, it, expect } from "vitest";
import { deliverWebhook } from "../src/delivery/dispatcher";

describe("deliverWebhook", () => {
  it("should deliver successfully on first attempt", async () => {
    const result = await deliverWebhook(
      { url: "https://example.com/hook", secret: "s", retryEnabled: false, maxRetries: 0 },
      '{"test": true}'
    );
    expect(result.delivered).toBe(true);
    expect(result.attempts).toBe(1);
  });

  it("should retry on transient failure", async () => {
    const result = await deliverWebhook(
      { url: "https://example.com/hook", secret: "s", retryEnabled: true, maxRetries: 3 },
      '{"test": true}',
      true
    );
    expect(result.delivered).toBe(false);
    expect(result.attempts).toBeGreaterThan(1);
  });
});
