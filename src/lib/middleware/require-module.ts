import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongoose';
import { ModuleSubscription } from '@/lib/models/module-subscription';
import type { AuthUser } from '@/types';

export async function requireModule(
  user: AuthUser,
  moduleKey: string
): Promise<NextResponse | null> {
  // SuperAdmin bypasses module checks
  if (user.role === 'superadmin') return null;

  if (!user.workspace) {
    return NextResponse.json(
      { error: 'User does not belong to a workspace' },
      { status: 403 }
    );
  }

  await dbConnect();

  const subscription = await ModuleSubscription.findOne({
    workspace: user.workspace,
    moduleKey,
    status: 'active',
  });

  if (!subscription) {
    return NextResponse.json(
      {
        error: `Module '${moduleKey}' is not active for this workspace`,
      },
      { status: 403 }
    );
  }

  return null;
}
