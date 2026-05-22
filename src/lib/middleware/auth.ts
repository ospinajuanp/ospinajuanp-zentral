import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import dbConnect from '@/lib/db/mongoose';
import { User } from '@/lib/models/user';
import type { AuthUser } from '@/types';

export type AuthResult =
  | { user: AuthUser; error?: undefined }
  | { user?: undefined; error: NextResponse };

export async function authenticate(request: NextRequest): Promise<AuthResult> {
  const authHeader = request.headers.get('authorization');

  if (!authHeader?.startsWith('Bearer ')) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  const token = authHeader.slice(7);

  await dbConnect();
  const user = await User.findById(token);

  if (!user || !user.isActive) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  return {
    user: {
      _id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      workspace: user.workspace?.toString() ?? null,
      isActive: user.isActive,
    },
  };
}

export function withAuth(
  handler: (req: NextRequest, user: AuthUser) => Promise<NextResponse>
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const result = await authenticate(req);
    if (result.error) return result.error;
    return handler(req, result.user);
  };
}
