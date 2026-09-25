import { describe, it, expect, beforeEach } from "vitest";
import { createKey, revokeKey, isKeyActive, _resetStore } from "../src/keys/keyManager";

beforeEach(() => _resetStore());

describe("key propagation regression", () => {
  it("should accept pending keys within the propagation window", () => {
    createKey("new_key", "sk_new", "us-east-1");
    const result = isKeyActive("new_key");
    expect(result.active).toBe(true);
  });
});