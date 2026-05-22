import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import dbConnect from '@/lib/db/mongoose';
import { User } from '@/lib/models/user';
import { verifyResetToken } from '@/lib/auth';
import { hashPassword } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const { token, newPassword } = await request.json();

  if (!token || !newPassword) {
    return NextResponse.json(
      { error: 'Token y nueva contraseña son requeridos' },
      { status: 400 }
    );
  }

  if (newPassword.length < 6) {
    return NextResponse.json(
      { error: 'La contraseña debe tener al menos 6 caracteres' },
      { status: 400 }
    );
  }

  let payload;
  try {
    payload = await verifyResetToken(token);
  } catch {
    return NextResponse.json(
      { error: 'El enlace es inválido o expiró. Solicita uno nuevo.' },
      { status: 400 }
    );
  }

  if (payload.purpose !== 'password-reset') {
    return NextResponse.json(
      { error: 'Token inválido' },
      { status: 400 }
    );
  }

  await dbConnect();

  const user = await User.findById(payload.userId);

  if (!user || !user.isActive) {
    return NextResponse.json(
      { error: 'Usuario no encontrado o desactivado' },
      { status: 400 }
    );
  }

  user.passwordHash = await hashPassword(newPassword);
  await user.save();

  return NextResponse.json({ message: 'Contraseña actualizada correctamente.' });
}
