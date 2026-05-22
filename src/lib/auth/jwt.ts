import { SignJWT, jwtVerify } from 'jose';
import type { Role } from '@/types';

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET!
);

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is not defined');
}

export interface JwtPayload {
  sub: string;
  role: Role;
  workspaceId: string | null;
  purpose: 'session';
}

export async function signJwt(payload: JwtPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(SECRET);
}

export async function verifyJwt(token: string): Promise<JwtPayload> {
  const { payload } = await jwtVerify(token, SECRET);
  if (payload.purpose !== 'session') {
    throw new Error('Invalid token purpose');
  }
  return payload as unknown as JwtPayload;
}

export interface ResetTokenPayload {
  userId: string;
  purpose: 'password-reset';
}

export async function signResetToken(payload: ResetTokenPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('15m')
    .sign(SECRET);
}

export async function verifyResetToken(token: string): Promise<ResetTokenPayload> {
  const { payload } = await jwtVerify(token, SECRET);
  if (payload.purpose !== 'password-reset') {
    throw new Error('Invalid token purpose');
  }
  return payload as unknown as ResetTokenPayload;
}

export interface VerificationTokenPayload {
  email: string;
  purpose: 'email-verification';
}

export async function signVerificationToken(payload: VerificationTokenPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(SECRET);
}

export async function verifyVerificationToken(token: string): Promise<VerificationTokenPayload> {
  const { payload } = await jwtVerify(token, SECRET);
  if (payload.purpose !== 'email-verification') {
    throw new Error('Invalid token purpose');
  }
  return payload as unknown as VerificationTokenPayload;
}
