import { describe, it, expect, beforeEach } from "vitest";
import { createKey, activateKey, revokeKey, isKeyActive, _resetStore } from "../src/keys/keyManager";

beforeEach(() => {
  _resetStore();
});

describe("isKeyActive", () => {
  it("should return active for activated keys", () => {
    createKey("key_1", "sk_test_123", "us-east-1");
    activateKey("key_1");
    expect(isKeyActive("key_1").active).toBe(true);
  });

  it("should return inactive for revoked keys", () => {
    createKey("key_1", "sk_test_123", "us-east-1");
    activateKey("key_1");
    revokeKey("key_1");
    expect(isKeyActive("key_1").active).toBe(false);
  });

  it("should accept pending keys within propagation window during rotation", () => {
    // Simulate key rotation: old key revoked, new key pending
    createKey("old_key", "sk_old", "us-east-1");
    activateKey("old_key");
    revokeKey("old_key");

    // New key just created — still pending async activation
    createKey("new_key", "sk_new", "us-east-1");

    // This test FAILS — pending keys should be accepted during
    // the propagation window (created < 15 min ago)
    const result = isKeyActive("new_key");
    expect(result.active).toBe(true);
  });

  it("should return not found for unknown keys", () => {
    expect(isKeyActive("nonexistent").active).toBe(false);
    expect(isKeyActive("nonexistent").reason).toBe("Key not found");
  });
});
