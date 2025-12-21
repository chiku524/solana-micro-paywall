import { createJWT } from './jwt';
import type { AccessJWTPayload } from './jwt';

export async function generateAccessToken(
  jwtSecret: string,
  merchantId: string,
  contentId: string,
  walletAddress: string,
  purchaseId: string,
  durationSeconds?: number
): Promise<string> {
  const signJWT = createJWT(jwtSecret);
  
  const expiresIn = durationSeconds 
    ? `${durationSeconds}s`
    : '24h'; // Default to 24 hours if no duration specified
  
  const payload: Omit<AccessJWTPayload, 'iat' | 'exp'> = {
    merchantId,
    contentId,
    walletAddress,
    purchaseId,
    type: 'access',
  };
  
  return await signJWT(payload, expiresIn);
}
