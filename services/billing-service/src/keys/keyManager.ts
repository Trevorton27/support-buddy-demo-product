export interface ApiKey {
  id: string;
  key: string;
  region: string;
  status: "pending" | "active" | "revoked";
  activatedAt: Date | null;
  createdAt: Date;
}

const keyStore = new Map<string, ApiKey>();

export function createKey(id: string, key: string, region: string): ApiKey {
  const apiKey: ApiKey = {
    id,
    key,
    region,
    status: "pending",
    activatedAt: null,
    createdAt: new Date(),
  };
  keyStore.set(id, apiKey);
  return apiKey;
}

export function activateKey(id: string): boolean {
  const key = keyStore.get(id);
  if (!key) return false;
  key.status = "active";
  key.activatedAt = new Date();
  return true;
}

export function revokeKey(id: string): boolean {
  const key = keyStore.get(id);
  if (!key) return false;
  key.status = "revoked";
  return true;
}

/**
 * Checks if a key is active and valid for authentication.
 *
 * BUG: Only checks status === "active". After key rotation, the new key
 * is created with status "pending" and activated asynchronously (5-10 min).
 * During this window, both old (now revoked) and new (still pending) keys
 * return false, causing 401 errors.
 *
 * Should also accept "pending" keys that were created within the
 * propagation window (e.g., last 15 minutes).
 */
export function isKeyActive(id: string): { active: boolean; reason?: string } {
  const key = keyStore.get(id);
  if (!key) return { active: false, reason: "Key not found" };
  if (key.status === "revoked") return { active: false, reason: "Key revoked" };

  // BUG: Does not handle the "pending" propagation window
  if (key.status !== "active") {
    return { active: false, reason: "Key not yet active" };
  }

  return { active: true };
}

export function _resetStore(): void {
  keyStore.clear();
}
