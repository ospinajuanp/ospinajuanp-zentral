import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import dbConnect from '@/lib/db/mongoose';
import { User } from '@/lib/models/user';
import { getApiAuth } from '@/lib/auth/api';

export async function GET(request: NextRequest) {
  const auth = await getApiAuth(request);
  if (!auth || auth.role !== 'superadmin') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  await dbConnect();

  const { searchParams } = new URL(request.url);
  const workspace = searchParams.get('workspace');

  const filter: Record<string, unknown> = {};
  if (workspace) filter.workspace = workspace;

  const users = await User.find(filter).sort({ createdAt: -1 }).lean();
  const count = await User.countDocuments(filter);

  return NextResponse.json({ users, count });
}

export async function POST() {
  return NextResponse.json(
    { error: 'La creación de usuarios desde el panel superadmin no está habilitada temporalmente.' },
    { status: 501 }
  );
}
