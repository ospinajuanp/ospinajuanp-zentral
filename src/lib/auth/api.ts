import { NextRequest } from 'next/server';
import { verifyJwt } from './jwt';
import type { Role } from '@/types';

export interface ApiAuth {
  userId: string;
  email: string;
  role: Role;
  workspaceId: string | null;
}

export async function getApiAuth(request: NextRequest): Promise<ApiAuth | null> {
  const token = request.cookies.get('zentral_session')?.value;
  if (!token) return null;
  try {
    const payload = await verifyJwt(token);
    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
      workspaceId: payload.workspaceId,
    };
  } catch {
    return null;
  }
}
