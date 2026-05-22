import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import dbConnect from '@/lib/db/mongoose';
import { User } from '@/lib/models/user';
import { signResetToken } from '@/lib/auth';
import { sendResetPasswordEmail } from '@/lib/email/resend';

export async function POST(request: NextRequest) {
  const { email } = await request.json();

  if (!email) {
    return NextResponse.json(
      { error: 'El email es requerido' },
      { status: 400 }
    );
  }

  await dbConnect();

  const user = await User.findOne({ email: email.toLowerCase(), isActive: true });

  if (!user) {
    return NextResponse.json({
      message: 'Si el email está registrado, recibirás un enlace de recuperación.',
    });
  }

  const token = await signResetToken({
    userId: user._id.toString(),
    purpose: 'password-reset',
  });

  try {
    await sendResetPasswordEmail(email, token);
  } catch {
    return NextResponse.json(
      { error: 'Error al enviar el correo. Intenta de nuevo más tarde.' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    message: 'Si el email está registrado, recibirás un enlace de recuperación.',
  });
}
