import { createHmac } from "crypto";

export interface WebhookRequest {
  headers: Record<string, string | undefined>;
  body: string;
}

export interface VerificationResult {
  valid: boolean;
  error?: string;
  headerUsed?: string;
}

/**
 * Verifies the HMAC signature of an incoming webhook request.
 *
 * After v3.1.2 deployment, the signature header was renamed from
 * X-Webhook-Sig to X-Signature-256.
 *
 * BUG: Only checks the new header name. Customers who haven't updated
 * their integration still send X-Webhook-Sig, causing ~30% failure rate.
 */
export function verifyWebhookSignature(
  request: WebhookRequest,
  secret: string,
  algorithm: string = "sha256"
): VerificationResult {
  // BUG: Only checks new header name, ignoring legacy header
  // Should also check: request.headers["x-webhook-sig"]
  const signature = request.headers["x-signature-256"];

  if (!signature) {
    return {
      valid: false,
      error: "HMAC header X-Signature-256 not present",
    };
  }

  const expected = createHmac(algorithm, secret)
    .update(request.body)
    .digest("hex");

  const prefixed = `${algorithm}=${expected}`;

  if (signature !== prefixed && signature !== expected) {
    return {
      valid: false,
      error: "Signature mismatch",
      headerUsed: "x-signature-256",
    };
  }

  return { valid: true, headerUsed: "x-signature-256" };
}
