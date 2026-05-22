import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import dbConnect from '@/lib/db/mongoose';
import { User } from '@/lib/models/user';
import { verifyVerificationToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const { token } = await request.json();

  if (!token) {
    return NextResponse.json(
      { error: 'Token requerido.' },
      { status: 400 }
    );
  }

  let payload: { email: string; purpose: string };
  try {
    payload = await verifyVerificationToken(token);
  } catch {
    return NextResponse.json(
      { error: 'Token inválido o expirado. Solicita un nuevo enlace de verificación.' },
      { status: 400 }
    );
  }

  if (payload.purpose !== 'email-verification') {
    return NextResponse.json(
      { error: 'Token inválido.' },
      { status: 400 }
    );
  }

  await dbConnect();

  const user = await User.findOne({ email: payload.email });

  if (!user) {
    return NextResponse.json(
      { error: 'Usuario no encontrado.' },
      { status: 404 }
    );
  }

  if (user.isActive) {
    return NextResponse.json({
      message: 'Tu correo ya está verificado. Puedes iniciar sesión.',
    });
  }

  user.isActive = true;
  await user.save();

  return NextResponse.json({
    message: 'Correo verificado correctamente. Ahora puedes iniciar sesión.',
  });
}
