import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import dbConnect from '@/lib/db/mongoose';
import { User } from '@/lib/models/user';
import { Workspace } from '@/lib/models/workspace';
import { Plan } from '@/lib/models/plan';
import { WorkspacePurchase } from '@/lib/models/workspace-purchase';
import { recalculateQuotas } from '@/lib/purchase/recalculate-quotas';
import { hashPassword, signVerificationToken } from '@/lib/auth';
import { sendVerificationEmail } from '@/lib/email/resend';
import { checkRateLimit } from '@/lib/middleware/rate-limit';
import { checkFeatureEnabled } from '@/lib/settings/guard';
import { getAppSettings } from '@/lib/models/app-settings';

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

  const featureCheck = await checkFeatureEnabled(request, 'registrationEnabled');
  if (featureCheck) return featureCheck;

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

  // Free plan is always included
  const freePlan = await Plan.findOne({ monthlyPrice: 0, isActive: true })
    .populate('includedModules.module', 'key _id defaultQuota tier')
    .lean();

  const workspaceName = companyName || `Workspace de ${name}`;
  const slug = workspaceName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  const passwordHash = await hashPassword(password);

  const isPayReady = true;

  // Build plans array: Free always included, plus selected plan if different
  const planIds: unknown[] = freePlan ? [freePlan._id] : [];
  if (selectedPlan && (!freePlan || String(selectedPlan._id) !== String(freePlan._id))) {
    planIds.push(selectedPlan._id);
  }

  const workspace = await Workspace.create({
    name: workspaceName,
    slug,
    owner: null,
    isPayReady,
    plans: planIds,
  });

  const settings = await getAppSettings();
  const emailVerificationRequired = settings.emailVerificationRequired;

  const user = await User.create({
    name,
    email: email.toLowerCase(),
    passwordHash,
    role: 'admin',
    workspace: workspace._id,
    isActive: !emailVerificationRequired,
  });

  workspace.owner = user._id;
  await workspace.save();

  // Create purchases: Free always, plus selected plan if different
  async function createPurchaseRecord(planData: typeof freePlan) {
    if (!planData) return;
    const modules = (planData.includedModules || []).map((pm: { module: { key: string; tier: string; defaultQuota: number }; quotaOverride: number | null }) => ({
      moduleKey: pm.module.key,
      quota: pm.quotaOverride ?? pm.module.defaultQuota ?? 100,
      tier: pm.module.tier ?? 'free',
    }));
    await WorkspacePurchase.create({
      workspace: workspace._id,
      plan: planData._id,
      planName: planData.name,
      amount: planData.monthlyPrice || 0,
      currency: 'COP',
      status: 'active',
      paymentMethod: 'simulated',
      modules,
    });
  }

  if (freePlan) await createPurchaseRecord(freePlan);
  if (selectedPlan && (!freePlan || String(selectedPlan._id) !== String(freePlan._id))) {
    await createPurchaseRecord(selectedPlan);
  }

  await recalculateQuotas(workspace._id.toString());

  if (emailVerificationRequired) {
    const verificationToken = await signVerificationToken({
      email: user.email,
      purpose: 'email-verification',
    });

    try {
      await sendVerificationEmail(user.email, verificationToken);
    } catch {
      // Email send failure is non-blocking — user can request a new link later
    }
  }

  return NextResponse.json({
    message: emailVerificationRequired
      ? 'Cuenta creada. Revisa tu bandeja de entrada para verificar tu correo electrónico.'
      : 'Cuenta creada exitosamente.',
    planName: selectedPlan?.name ?? null,
    isPayReady: true,
  });
}