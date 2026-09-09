export interface Certificate {
  id: string;
  region: string;
  publicKey: string;
  expiresAt: Date;
  active: boolean;
}

export interface WebhookConfig {
  url: string;
  secret: string;
  algorithm: "sha256" | "sha512";
  headerName: string;
  retryEnabled: boolean;
  maxRetries: number;
}

export interface ApiKey {
  id: string;
  key: string;
  region: string;
  status: "pending" | "active" | "revoked";
  activatedAt: Date | null;
  createdAt: Date;
}

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  burstMultiplier: number;
  burstWindowMs: number;
}

export interface PoolConfig {
  maxConnections: number;
  instanceCount: number;
  perInstanceMax: number;
  idleTimeoutMs: number;
}

export type Region = "us-east-1" | "us-west-2" | "eu-west-1" | "ap-southeast-1";
