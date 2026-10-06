import { describe, it, expect } from "vitest";
import { getCertificateForRegion, validateSamlAssertion } from "../src/saml/validator";
import type { Certificate } from "../src/types";

const FUTURE = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

const certificates: Certificate[] = [
  {
    id: "cert_us",
    region: "us-east-1",
    publicKey: "us-key-abc123",
    expiresAt: FUTURE,
    active: true,
  },
  {
    id: "cert_eu",
    region: "eu-west-1",
    publicKey: "eu-key-xyz789",
    expiresAt: FUTURE,
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

  it("should not fall back to another region's certificate", () => {
    const usOnly = certificates.filter((c) => c.region === "us-east-1");
    expect(getCertificateForRegion("eu-west-1", usOnly)).toBeNull();
  });

  it("should pick the active rotated EU certificate over a deactivated one", () => {
    const rotated: Certificate[] = [
      ...certificates.filter((c) => c.region === "us-east-1"),
      { id: "cert_eu_old", region: "eu-west-1", publicKey: "eu-key-old", expiresAt: FUTURE, active: false },
      { id: "cert_eu_new", region: "eu-west-1", publicKey: "eu-key-new", expiresAt: FUTURE, active: true },
    ];
    expect(getCertificateForRegion("eu-west-1", rotated)!.id).toBe("cert_eu_new");
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
