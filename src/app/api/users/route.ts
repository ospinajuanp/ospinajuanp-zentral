import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import dbConnect from '@/lib/db/mongoose';
import { User } from '@/lib/models/user';
import { getApiAuth } from '@/lib/auth/api';
import { hashPassword } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const auth = await getApiAuth(request);
  if (!auth || auth.role !== 'admin') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  await dbConnect();

  const users = await User.find({ workspace: auth.workspaceId })
    .sort({ createdAt: -1 })
    .lean();

  return NextResponse.json({ users, count: users.length });
}

export async function POST(request: NextRequest) {
  const auth = await getApiAuth(request);
  if (!auth || auth.role !== 'admin') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const { name, email, password, role } = await request.json();

  if (!name || !email || !password || !role) {
    return NextResponse.json(
      { error: 'Todos los campos son requeridos' },
      { status: 400 }
    );
  }

  if (!['admin', 'operador', 'hijo'].includes(role)) {
    return NextResponse.json(
      { error: 'Rol inválido. Solo puedes crear usuarios con rol admin o usuario.' },
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
      { error: 'Ya existe un usuario con este email' },
      { status: 409 }
    );
  }

  const passwordHash = await hashPassword(password);

  const user = await User.create({
    name,
    email: email.toLowerCase(),
    passwordHash,
    role,
    workspace: auth.workspaceId,
    isActive: true,
    createdBy: auth.userId,
  });

  return NextResponse.json(
    { message: 'Usuario creado correctamente', user },
    { status: 201 }
  );
}
