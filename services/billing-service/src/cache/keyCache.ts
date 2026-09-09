const cache = new Map<string, { value: string; expiresAt: number }>();

export function getCached(key: string): string | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.value;
}

export function setCached(key: string, value: string, ttlMs: number): void {
  cache.set(key, { value, expiresAt: Date.now() + ttlMs });
}

export function clearCache(): void {
  cache.clear();
}
