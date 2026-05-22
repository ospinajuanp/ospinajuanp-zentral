import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import dbConnect from '@/lib/db/mongoose';
import { User } from '@/lib/models/user';
import { Workspace } from '@/lib/models/workspace';
import { ModuleSubscription } from '@/lib/models/module-subscription';
import { hashPassword, signVerificationToken } from '@/lib/auth';
import { sendVerificationEmail } from '@/lib/email/resend';
import { checkRateLimit } from '@/lib/middleware/rate-limit';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  const rateLimit = await checkRateLimit(request, 'register');
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Demasiados intentos. Por favor, inténtalo de nuevo más tarde.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(rateLimit.retryAfter),
          'X-RateLimit-Limit': '3',
          'X-RateLimit-Remaining': '0',
          'Cache-Control': 'no-store, max-age=0, must-revalidate',
        },
      }
    );
  }

  const { name, email, password, companyName } = await request.json();

  if (!name || !email || !password) {
    return NextResponse.json(
      { error: 'Todos los campos son requeridos' },
      { status: 400 }
    );
  }

  if (!EMAIL_REGEX.test(email)) {
    return NextResponse.json(
      { error: 'Formato de email inválido.' },
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
    isActive: false,
  });

  workspace.owner = user._id;
  await workspace.save();

  await ModuleSubscription.create({
    workspace: workspace._id,
    moduleKey: 'transfercheck',
    tier: 'free',
    status: 'active',
  });

  const verificationToken = await signVerificationToken({
    email: user.email,
    purpose: 'email-verification',
  });

  try {
    await sendVerificationEmail(user.email, verificationToken);
  } catch {
    // Email send failure is non-blocking — user can request a new link later
  }

  return NextResponse.json({
    message:
      'Cuenta creada. Revisa tu bandeja de entrada para verificar tu correo electrónico.',
  });
}
