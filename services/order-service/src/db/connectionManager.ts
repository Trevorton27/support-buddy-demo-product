export interface ConnectionPool {
  activeConnections: number;
  maxConnections: number;
  waitingRequests: number;
}

export function createPool(maxConnections: number): ConnectionPool {
  return { activeConnections: 0, maxConnections, waitingRequests: 0 };
}

export function acquireConnection(pool: ConnectionPool): {
  acquired: boolean;
  error?: string;
} {
  if (pool.activeConnections >= pool.maxConnections) {
    pool.waitingRequests++;
    return { acquired: false, error: "too many connections" };
  }
  pool.activeConnections++;
  return { acquired: true };
}

export function releaseConnection(pool: ConnectionPool): void {
  if (pool.activeConnections > 0) {
    pool.activeConnections--;
  }
}
