import { describe, it, expect } from "vitest";
import { getCertificateForRegion, validateSamlAssertion } from "../src/saml/validator";
import type { Certificate } from "../src/types";

const certificates: Certificate[] = [
  {
    id: "cert_us",
    region: "us-east-1",
    publicKey: "us-key-abc123",
    expiresAt: new Date("2025-12-31"),
    active: true,
  },
  {
    id: "cert_eu",
    region: "eu-west-1",
    publicKey: "eu-key-xyz789",
    expiresAt: new Date("2025-12-31"),
    active: true,
  },
];

describe("getCertificateForRegion", () => {
  it("should return the US certificate for us-east-1", () => {
    const cert = getCertificateForRegion("us-east-1", certificates);
    expect(cert).not.toBeNull();
    expect(cert!.id).toBe("cert_us");
    expect(cert!.region).toBe("us-east-1");
  });

  it("should return the EU certificate for eu-west-1", () => {
    // This test FAILS due to the bug — returns cert_us instead of cert_eu
    const cert = getCertificateForRegion("eu-west-1", certificates);
    expect(cert).not.toBeNull();
    expect(cert!.id).toBe("cert_eu");
    expect(cert!.region).toBe("eu-west-1");
  });

  it("should return null when no active certs exist", () => {
    const expired: Certificate[] = [
      { id: "old", region: "us-east-1", publicKey: "key", expiresAt: new Date("2020-01-01"), active: true },
    ];
    expect(getCertificateForRegion("us-east-1", expired)).toBeNull();
  });
});

describe("validateSamlAssertion", () => {
  it("should validate a US user assertion successfully", () => {
    const result = validateSamlAssertion(
      {
        issuer: "https://idp.example.com",
        signature: "sig_us-east-1_us-key-abc123",
        region: "us-east-1",
        payload: { email: "user@example.com" },
      },
      certificates
    );
    expect(result.valid).toBe(true);
  });

  it("should validate an EU user assertion successfully", () => {
    // This test FAILS — the bug causes it to check against the US cert
    const result = validateSamlAssertion(
      {
        issuer: "https://idp.example.com",
        signature: "sig_eu-west-1_eu-key-xyz789",
        region: "eu-west-1",
        payload: { email: "eu-user@example.com" },
      },
      certificates
    );
    expect(result.valid).toBe(true);
    expect(result.certificateId).toBe("cert_eu");
  });
});
