import { describe, it, expect } from "vitest";
import { createHmac } from "crypto";
import { verifyWebhookSignature } from "../src/middleware/signatureVerifier";

const SECRET = "whsec_test_secret_123";
const BODY = '{"event":"order.created","data":{"id":"ord_001"}}';

function makeSignature(body: string, secret: string, algo: string = "sha256"): string {
  return `${algo}=${createHmac(algo, secret).update(body).digest("hex")}`;
}

describe("verifyWebhookSignature", () => {
  it("should verify signature with new X-Signature-256 header", () => {
    const sig = makeSignature(BODY, SECRET);
    const result = verifyWebhookSignature(
      { headers: { "x-signature-256": sig }, body: BODY },
      SECRET
    );
    expect(result.valid).toBe(true);
    expect(result.headerUsed).toBe("x-signature-256");
  });

  it("should verify signature with legacy X-Webhook-Sig header", () => {
    // This test FAILS — the bug ignores the legacy header
    const sig = makeSignature(BODY, SECRET);
    const result = verifyWebhookSignature(
      { headers: { "x-webhook-sig": sig }, body: BODY },
      SECRET
    );
    expect(result.valid).toBe(true);
  });

  it("should reject request with no signature header", () => {
    const result = verifyWebhookSignature(
      { headers: {}, body: BODY },
      SECRET
    );
    expect(result.valid).toBe(false);
    expect(result.error).toContain("not present");
  });

  it("should reject request with wrong signature", () => {
    const result = verifyWebhookSignature(
      { headers: { "x-signature-256": "sha256=wrong" }, body: BODY },
      SECRET
    );
    expect(result.valid).toBe(false);
    expect(result.error).toContain("mismatch");
  });

  it("should support both headers simultaneously", () => {
    // Customer sends both old and new headers during migration
    const sig = makeSignature(BODY, SECRET);
    const result = verifyWebhookSignature(
      { headers: { "x-webhook-sig": sig, "x-signature-256": sig }, body: BODY },
      SECRET
    );
    expect(result.valid).toBe(true);
  });
});
