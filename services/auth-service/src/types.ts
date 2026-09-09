export interface Certificate {
  id: string;
  region: string;
  publicKey: string;
  expiresAt: Date;
  active: boolean;
}
