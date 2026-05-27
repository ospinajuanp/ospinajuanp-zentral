import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import dbConnect from '@/lib/db/mongoose';
import { User } from '@/lib/models/user';
import { getApiAuth } from '@/lib/auth/api';
import { hashPassword } from '@/lib/auth';
import { checkFeatureEnabled } from '@/lib/settings/guard';

async function getOwnedUser(workspaceId: string | null, userId: string) {
  if (!workspaceId) return null;
  await dbConnect();
  return User.findOne({ _id: userId, workspace: workspaceId });
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getApiAuth(_request);
  if (!auth || auth.role !== 'admin') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const check = await checkFeatureEnabled(_request, 'adminUsersEnabled');
  if (check) return check;

  const { id } = await params;
  const user = await getOwnedUser(auth.workspaceId, id);
  if (!user) {
    return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
  }

  return NextResponse.json({ user });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getApiAuth(request);
  if (!auth || auth.role !== 'admin') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const check = await checkFeatureEnabled(request, 'adminUsersEnabled');
  if (check) return check;

  const { id } = await params;
  const user = await getOwnedUser(auth.workspaceId, id);
  if (!user) {
    return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
  }

  const body = await request.json();
  const { name, email, role, password } = body;

  if (name !== undefined) user.name = name;
  if (email !== undefined) user.email = email;
  if (role !== undefined) {
    if (role === 'superadmin') {
      return NextResponse.json(
        { error: 'No puedes asignar el rol superadmin.' },
        { status: 403 }
      );
    }
    if (!['admin', 'operador', 'hijo'].includes(role)) {
      return NextResponse.json({ error: 'Rol inválido' }, { status: 400 });
    }
    user.role = role;
  }
  if (password) user.passwordHash = await hashPassword(password);

  await user.save();

  return NextResponse.json({ message: 'Usuario actualizado correctamente', user });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getApiAuth(_request);
  if (!auth || auth.role !== 'admin') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const check = await checkFeatureEnabled(_request, 'adminUsersEnabled');
  if (check) return check;

  const { id } = await params;

  await dbConnect();
  const user = await User.findOneAndDelete({ _id: id, workspace: auth.workspaceId });
  if (!user) {
    return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
  }

  return NextResponse.json({ message: 'Usuario eliminado correctamente' });
}
