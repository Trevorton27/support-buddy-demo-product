export interface SessionContext {
  userId: string;
  organizationId: string;
  region: string;
  createdAt: Date;
  lastAccessedAt: Date;
}

const sessionStore = new Map<string, SessionContext>();

/**
 * Creates or retrieves a session context.
 * BUG: When switching organizations, the old session context is returned
 * instead of creating a new one. Should check if orgId matches.
 */
export function getOrCreateSession(
  sessionId: string,
  userId: string,
  organizationId: string,
  region: string
): SessionContext {
  const existing = sessionStore.get(sessionId);

  // BUG: Returns existing session even if organizationId changed.
  // Should validate: existing.organizationId === organizationId
  if (existing) {
    existing.lastAccessedAt = new Date();
    return existing;
  }

  const session: SessionContext = {
    userId,
    organizationId,
    region,
    createdAt: new Date(),
    lastAccessedAt: new Date(),
  };

  sessionStore.set(sessionId, session);
  return session;
}

export function clearSession(sessionId: string): void {
  sessionStore.delete(sessionId);
}

export function _resetStore(): void {
  sessionStore.clear();
}
