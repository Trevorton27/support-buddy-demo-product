export interface OrderQuery {
  customerId: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}

export interface QueryConfig {
  timeoutMs: number;
  maxRetries: number;
}

export interface OrderResult {
  orders: Array<{ id: string; total: number; createdAt: Date }>;
  queryTimeMs: number;
  timedOut: boolean;
}

/**
 * Executes an order query with timeout protection.
 *
 * BUG: The timeout is hardcoded to 3000ms instead of using config.timeoutMs.
 * Deploy v2.4.1 changed QUERY_TIMEOUT_MS to 10000ms but this code ignores it.
 * Heavy reporting queries that take 3-10 seconds will incorrectly time out.
 */
export async function executeOrderQuery(
  query: OrderQuery,
  config: QueryConfig,
  simulatedQueryTimeMs: number = 100
): Promise<OrderResult> {
  // BUG: Hardcoded 3000ms timeout instead of config.timeoutMs
  const effectiveTimeout = 3000;

  if (simulatedQueryTimeMs > effectiveTimeout) {
    return {
      orders: [],
      queryTimeMs: effectiveTimeout,
      timedOut: true,
    };
  }

  // Simulate query execution
  return {
    orders: [
      { id: `ord_${query.customerId}_1`, total: 99.99, createdAt: new Date() },
    ],
    queryTimeMs: simulatedQueryTimeMs,
    timedOut: false,
  };
}

/**
 * Health check for the order service.
 */
export function getServiceHealth(config: QueryConfig): {
  status: string;
  configuredTimeoutMs: number;
  effectiveTimeoutMs: number;
  mismatch: boolean;
} {
  return {
    status: "healthy",
    configuredTimeoutMs: config.timeoutMs,
    // BUG: This correctly reads config but executeOrderQuery ignores it
    effectiveTimeoutMs: 3000,
    mismatch: config.timeoutMs !== 3000,
  };
}
