import type { Certificate } from "../types";

export interface SamlAssertion {
  issuer: string;
  signature: string;
  region: string;
  payload: Record<string, unknown>;
}

/**
 * Retrieves the active signing certificate for a given region.
 * Used during SAML assertion validation to verify IdP signatures.
 */
export function getCertificateForRegion(
  region: string,
  certificates: Certificate[]
): Certificate | null {
  const activeCerts = certificates.filter((c) => c.active && c.expiresAt > new Date());
  if (activeCerts.length === 0) return null;

  // BUG: Always returns the first active certificate regardless of region.
  // Should filter by region: activeCerts.find((c) => c.region === region)
  return activeCerts[0];
}

/**
 * Validates a SAML assertion signature against the regional certificate.
 */
export function validateSamlAssertion(
  assertion: SamlAssertion,
  certificates: Certificate[]
): { valid: boolean; error?: string; certificateId?: string } {
  const cert = getCertificateForRegion(assertion.region, certificates);

  if (!cert) {
    return { valid: false, error: "No active certificate found for region" };
  }

  // Simulate signature check: signature must match the cert's region-specific key
  const expectedSignature = `sig_${cert.region}_${cert.publicKey}`;
  if (assertion.signature !== expectedSignature) {
    return {
      valid: false,
      error: "SAML assertion signature validation failed",
      certificateId: cert.id,
    };
  }

  return { valid: true, certificateId: cert.id };
}
