import { SignJWT, jwtVerify } from 'jose';

export function createJWT(secret: string): (payload: Record<string, unknown>, expiresIn?: string) => Promise<string> {
  return async (payload: Record<string, unknown>, expiresIn = '24h') => {
    const secretKey = new TextEncoder().encode(secret);
    return await new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(expiresIn)
      .sign(secretKey);
  };
}

export function verifyJWT(secret: string): (token: string) => Promise<Record<string, unknown>> {
  return async (token: string) => {
    const secretKey = new TextEncoder().encode(secret);
    const { payload } = await jwtVerify(token, secretKey);
    return payload as Record<string, unknown>;
  };
}

export interface MerchantJWTPayload {
  merchantId: string;
  type: 'merchant';
  iat?: number;
  exp?: number;
}

export interface AccessJWTPayload {
  merchantId: string;
  contentId: string;
  walletAddress: string;
  purchaseId: string;
  type: 'access';
  iat?: number;
  exp?: number;
}
