export interface PoolConfig {
  maxDbConnections: number;
  defaultPoolSize: number;
  instanceCount: number;
  reservedConnections: number;
}

export interface PoolRecommendation {
  perInstancePoolSize: number;
  totalConnections: number;
  withinLimit: boolean;
  warning?: string;
}

/**
 * Calculates the per-instance connection pool size.
 *
 * BUG: Returns defaultPoolSize directly without dividing by instanceCount.
 * When a customer scales from 1 to 20 instances, each instance opens
 * defaultPoolSize (25) connections = 500 total, exceeding the DB's
 * maxDbConnections (100).
 *
 * Correct formula: (maxDbConnections - reservedConnections) / instanceCount
 */
export function calculatePoolSize(config: PoolConfig): PoolRecommendation {
  // BUG: Ignores instanceCount — just returns the default
  const perInstancePoolSize = config.defaultPoolSize;

  const totalConnections = perInstancePoolSize * config.instanceCount;
  const withinLimit = totalConnections <= config.maxDbConnections;

  return {
    perInstancePoolSize,
    totalConnections,
    withinLimit,
    warning: withinLimit
      ? undefined
      : `Total connections (${totalConnections}) exceed database limit (${config.maxDbConnections})`,
  };
}

/**
 * Validates that current pool settings won't cause exhaustion.
 */
export function validatePoolHealth(
  activeConnections: number,
  maxConnections: number
): { healthy: boolean; utilizationPct: number; error?: string } {
  const utilizationPct = Math.round((activeConnections / maxConnections) * 100);
  if (activeConnections >= maxConnections) {
    return {
      healthy: false,
      utilizationPct: 100,
      error: "too many connections",
    };
  }
  return { healthy: true, utilizationPct };
}
