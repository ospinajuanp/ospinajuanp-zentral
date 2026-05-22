import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import dbConnect from '@/lib/db/mongoose';
import { User } from '@/lib/models/user';
import { Workspace } from '@/lib/models/workspace';
import { verifyPassword, signJwt } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const { email, password } = await request.json();

  if (!email || !password) {
    return NextResponse.json(
      { error: 'Email and password are required' },
      { status: 400 }
    );
  }

  await dbConnect();

  const user = await User.findOne({ email: email.toLowerCase() });

  if (!user) {
    return NextResponse.json(
      { error: 'Invalid credentials' },
      { status: 401 }
    );
  }

  const valid = await verifyPassword(password, user.passwordHash);

  if (!valid) {
    return NextResponse.json(
      { error: 'Invalid credentials' },
      { status: 401 }
    );
  }

  if (!user.isActive) {
    return NextResponse.json(
      { error: 'Account is deactivated' },
      { status: 403 }
    );
  }

  // For admin/hijo roles, verify workspace is active
  if (user.role !== 'superadmin' && user.workspace) {
    const workspace = await Workspace.findById(user.workspace);
    if (!workspace || !workspace.isActive) {
      return NextResponse.json(
        { error: 'Workspace is not active' },
        { status: 403 }
      );
    }
  }

  const token = await signJwt({
    sub: user._id.toString(),
    role: user.role,
    workspaceId: user.workspace?.toString() ?? null,
  });

  const redirectTo = user.role === 'superadmin' ? '/admin' : '/dashboard';

  const response = NextResponse.json({
    user: {
      name: user.name,
      email: user.email,
      role: user.role,
    },
    redirect: redirectTo,
  });

  response.cookies.set('zentral_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  return response;
}
