import { SignJWT, jwtVerify, JWTPayload } from 'jose';

export interface TokenPayload extends JWTPayload {
  userId: string;
  role: string;
  onboardingCompleted: boolean;
}

// JWT_SECRET MUST be set in your .env file. 
// Generate one with: openssl rand -base64 32
const jwtSecretEnv = process.env.JWT_SECRET;
if (!jwtSecretEnv) {
  throw new Error(
    'CRITICAL: JWT_SECRET environment variable is not set. ' +
    'Generate one with: openssl rand -base64 32 and add it to your .env file.'
  );
}
const JWT_SECRET = new TextEncoder().encode(jwtSecretEnv);

export async function signToken(payload: { userId: string; role: string; onboardingCompleted: boolean }): Promise<string> {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('2h')
    .sign(JWT_SECRET);
  return token;
}

export class TokenExpiredError extends Error {}
export class TokenInvalidError extends Error {}

export async function verifyToken(token: string): Promise<TokenPayload> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      algorithms: ['HS256'],
    });
    return payload as TokenPayload;
  } catch (error: any) {
    if (error?.code === 'ERR_JWT_EXPIRED') {
      throw new TokenExpiredError('Token has expired');
    }
    throw new TokenInvalidError('Invalid token');
  }
}
