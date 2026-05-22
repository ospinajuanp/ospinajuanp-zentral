import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import dbConnect from '@/lib/db/mongoose';
import { User } from '@/lib/models/user';
import { Workspace } from '@/lib/models/workspace';
import { ModuleSubscription } from '@/lib/models/module-subscription';
import { hashPassword, signJwt } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const { name, email, password, companyName } = await request.json();

  if (!name || !email || !password) {
    return NextResponse.json(
      { error: 'Todos los campos son requeridos' },
      { status: 400 }
    );
  }

  if (password.length < 6) {
    return NextResponse.json(
      { error: 'La contraseña debe tener al menos 6 caracteres' },
      { status: 400 }
    );
  }

  await dbConnect();

  const existing = await User.findOne({ email: email.toLowerCase() });

  if (existing) {
    return NextResponse.json(
      { error: 'Este email ya está registrado' },
      { status: 409 }
    );
  }

  const workspaceName = companyName || `Workspace de ${name}`;
  const slug = workspaceName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  const passwordHash = await hashPassword(password);

  const workspace = await Workspace.create({
    name: workspaceName,
    slug,
    owner: null,
  });

  const user = await User.create({
    name,
    email: email.toLowerCase(),
    passwordHash,
    role: 'admin',
    workspace: workspace._id,
  });

  workspace.owner = user._id;
  await workspace.save();

  await ModuleSubscription.create({
    workspace: workspace._id,
    moduleKey: 'transfercheck',
    tier: 'free',
    status: 'active',
  });

  const token = await signJwt({
    sub: user._id.toString(),
    role: user.role,
    workspaceId: workspace._id.toString(),
  });

  const response = NextResponse.json({
    user: { name: user.name, email: user.email, role: user.role },
    redirect: '/dashboard',
  });

  response.cookies.set('zentral_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });

  return response;
}
