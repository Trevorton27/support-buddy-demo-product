import { describe, it, expect, beforeEach } from "vitest";
import { getOrCreateSession, _resetStore } from "../src/session/context";

beforeEach(() => {
  _resetStore();
});

describe("getOrCreateSession", () => {
  it("should create a new session", () => {
    const session = getOrCreateSession("sess_1", "user_1", "org_alpha", "us-east-1");
    expect(session.organizationId).toBe("org_alpha");
    expect(session.userId).toBe("user_1");
  });

  it("should return existing session for same session ID", () => {
    getOrCreateSession("sess_1", "user_1", "org_alpha", "us-east-1");
    const session = getOrCreateSession("sess_1", "user_1", "org_alpha", "us-east-1");
    expect(session.organizationId).toBe("org_alpha");
  });

  it("should update context when organization changes", () => {
    // This test FAILS — the bug returns stale org context
    getOrCreateSession("sess_1", "user_1", "org_alpha", "us-east-1");
    const session = getOrCreateSession("sess_1", "user_1", "org_beta", "us-east-1");
    expect(session.organizationId).toBe("org_beta");
  });
});
