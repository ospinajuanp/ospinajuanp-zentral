import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import dbConnect from '@/lib/db/mongoose';
import { User } from '@/lib/models/user';
import { getApiAuth } from '@/lib/auth/api';
import { hashPassword } from '@/lib/auth';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getApiAuth(_request);
  if (!auth || auth.role !== 'superadmin') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  await dbConnect();
  const { id } = await params;

  const user = await User.findById(id).lean();
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
  if (!auth || auth.role !== 'superadmin') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  await dbConnect();
  const { id } = await params;

  const user = await User.findById(id);
  if (!user) {
    return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
  }

  const body = await request.json();
  const { name, email, role, isActive, workspace, password } = body;

  if (name !== undefined) user.name = name;
  if (email !== undefined) user.email = email;
  if (role !== undefined) {
    if (!['superadmin', 'admin', 'hijo'].includes(role)) {
      return NextResponse.json({ error: 'Rol inválido' }, { status: 400 });
    }
    user.role = role;
  }
  if (isActive !== undefined) user.isActive = isActive;
  if (workspace !== undefined) user.workspace = workspace || null;
  if (password) user.passwordHash = await hashPassword(password);

  await user.save();

  return NextResponse.json({ message: 'Usuario actualizado correctamente', user });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getApiAuth(_request);
  if (!auth || auth.role !== 'superadmin') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  await dbConnect();
  const { id } = await params;

  const user = await User.findByIdAndDelete(id);
  if (!user) {
    return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
  }

  return NextResponse.json({ message: 'Usuario eliminado correctamente' });
}
