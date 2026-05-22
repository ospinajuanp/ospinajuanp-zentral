import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import dbConnect from '@/lib/db/mongoose';
import { User } from '@/lib/models/user';
import { Workspace } from '@/lib/models/workspace';
import { ModuleSubscription } from '@/lib/models/module-subscription';
import { Module } from '@/lib/models/module';
import { Plan } from '@/lib/models/plan';
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
          'X-RateLimit-Limit': '25',
          'X-RateLimit-Remaining': '0',
          'Cache-Control': 'no-store, max-age=0, must-revalidate',
        },
      }
    );
  }

  const { name, email, password, companyName, planId } = await request.json();

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

  // Determine which plan to use
  let selectedPlan = null;
  if (planId) {
    selectedPlan = await Plan.findById(planId)
      .populate('includedModules.module', 'key _id defaultQuota tier')
      .lean();
  }
  // Fallback to first active plan sorted by sortOrder
  if (!selectedPlan) {
    selectedPlan = await Plan.findOne({ isActive: true })
      .sort({ sortOrder: 1 })
      .populate('includedModules.module', 'key _id defaultQuota tier')
      .lean();
  }

  const workspaceName = companyName || `Workspace de ${name}`;
  const slug = workspaceName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  const passwordHash = await hashPassword(password);

  // Determine if workspace should be pay-ready (true for free plans, false for paid plans)
  const isFreePlan = selectedPlan && (!selectedPlan.monthlyPrice || selectedPlan.monthlyPrice === 0);
  const isEnterprisePlan = selectedPlan?.isEnterprise ?? false;
  const shouldAutoActivate = isFreePlan && !isEnterprisePlan;

  const workspace = await Workspace.create({
    name: workspaceName,
    slug,
    owner: null,
    isPayReady: shouldAutoActivate,
    plan: selectedPlan?._id ?? null,
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

  // Create subscriptions from the selected plan
  if (selectedPlan && selectedPlan.includedModules && selectedPlan.includedModules.length > 0) {
    const allModules = await Module.find().lean();
    const subs = selectedPlan.includedModules.map((im: { module: { key: string; _id: string }; quotaOverride: number | null }) => {
      const mod = allModules.find((m) => m._id.toString() === im.module._id.toString());
      return {
        workspace: workspace._id,
        moduleKey: mod?.key ?? im.module.key,
        tier: mod?.tier ?? 'free',
        status: shouldAutoActivate ? 'active' : 'inactive',
        monthlyQuota: im.quotaOverride ?? mod?.defaultQuota ?? 100,
        usedQuota: 0,
        quotaResetAt: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1),
      };
    });
    await ModuleSubscription.insertMany(subs);
  } else if (!isEnterprisePlan) {
    // Fallback for plans with no modules: create transfercheck subscription
    await ModuleSubscription.create({
      workspace: workspace._id,
      moduleKey: 'transfercheck',
      tier: 'free',
      status: shouldAutoActivate ? 'active' : 'inactive',
      monthlyQuota: 100,
      usedQuota: 0,
      quotaResetAt: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1),
    });
  }

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
    planName: selectedPlan?.name ?? null,
    isPayReady: shouldAutoActivate,
  });
}