import { describe, it, expect } from "vitest";
import { createHmac } from "crypto";
import { verifyWebhookSignature } from "../src/middleware/signatureVerifier";

const SECRET = "whsec_test";
const BODY = '{"event":"test"}';

describe("legacy header regression", () => {
  it("should accept X-Webhook-Sig header from pre-v3.1.2 integrations", () => {
    const sig = `sha256=${createHmac("sha256", SECRET).update(BODY).digest("hex")}`;
    const result = verifyWebhookSignature({ headers: { "x-webhook-sig": sig }, body: BODY }, SECRET);
    expect(result.valid).toBe(true);
  });
});