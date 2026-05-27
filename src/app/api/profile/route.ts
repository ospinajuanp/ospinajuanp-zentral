import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import dbConnect from '@/lib/db/mongoose';
import { User } from '@/lib/models/user';
import { getApiAuth } from '@/lib/auth/api';
import { hashPassword, verifyPassword } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const auth = await getApiAuth(request);
  if (!auth) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  await dbConnect();
  const user = await User.findById(auth.userId);
  if (!user) {
    return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
  }

  return NextResponse.json({
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
    },
  });
}

export async function PATCH(request: NextRequest) {
  const auth = await getApiAuth(request);
  if (!auth) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const body = await request.json();
  const { name, currentPassword, newPassword } = body;

  await dbConnect();
  const user = await User.findById(auth.userId).select('+passwordHash');
  if (!user) {
    return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
  }

  if (newPassword) {
    if (!currentPassword) {
      return NextResponse.json(
        { error: 'Debes ingresar tu contraseña actual' },
        { status: 400 }
      );
    }

    const valid = await verifyPassword(currentPassword, user.passwordHash);
    if (!valid) {
      return NextResponse.json(
        { error: 'La contraseña actual es incorrecta' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'La nueva contraseña debe tener al menos 6 caracteres' },
        { status: 400 }
      );
    }

    user.passwordHash = await hashPassword(newPassword);
  }

  if (name !== undefined && name.trim()) {
    user.name = name.trim();
  }

  await user.save();

  return NextResponse.json({
    message: 'Perfil actualizado correctamente',
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
    },
  });
}
