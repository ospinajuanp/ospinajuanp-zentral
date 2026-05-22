import { NextResponse } from 'next/server';
import type { AuthUser, Role } from '@/types';

export function requireRole(
  user: AuthUser,
  allowedRoles: Role[]
): NextResponse | null {
  // SuperAdmin bypasses all role checks
  if (user.role === 'superadmin') return null;

  if (!allowedRoles.includes(user.role)) {
    return NextResponse.json(
      {
        error: `Role '${user.role}' is not allowed. Required: ${allowedRoles.join(', ')}`,
      },
      { status: 403 }
    );
  }

  return null;
}
