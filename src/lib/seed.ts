import dbConnect from './db/mongoose';
import { User } from './models/user';
import { Workspace } from './models/workspace';
import { Module } from './models/module';
import { Plan } from './models/plan';
import { WorkspacePurchase } from './models/workspace-purchase';
import { recalculateQuotas } from './purchase/recalculate-quotas';
import { hashPassword } from './auth';

interface PlanSeed {
  name: string; price: string; monthlyPrice: number | null; description: string;
  moduleKeys: string[]; maxUsers: number; extraFeatures: string[];
  cta: string; highlighted: boolean; isEnterprise: boolean; sortOrder: number;
  support: string; onboarding: string; whatsappNumber: string;
}

const defaultPlanDefs: PlanSeed[] = [
  {
    name: 'Free', price: '$0', monthlyPrice: 0,
    description: 'Para empezar a usar Zentral.',
    moduleKeys: ['transfercheck'],
    maxUsers: 1,
    extraFeatures: [],
    cta: 'Empezar gratis', highlighted: false, isEnterprise: false, sortOrder: 0,
    support: 'ninguno', onboarding: 'ninguno', whatsappNumber: '',
  },
  {
    name: 'Premium', price: '$12', monthlyPrice: 12,
    description: 'Para equipos que necesitan más.',
    moduleKeys: ['transfercheck', 'antecedentes', 'facturacion', 'cartera'],
    maxUsers: 5,
    extraFeatures: ['Módulos en beta gratis'],
    cta: 'Ver módulos', highlighted: true, isEnterprise: false, sortOrder: 1,
    support: 'email', onboarding: 'autoguiado', whatsappNumber: '',
  },
  {
    name: 'Premium Plus', price: '$24', monthlyPrice: 24,
    description: 'Máxima potencia sin límites de usuarios.',
    moduleKeys: ['transfercheck', 'antecedentes', 'facturacion', 'cartera'],
    maxUsers: 0,
    extraFeatures: ['Módulos en beta gratis', 'Onboarding con videos', 'Reportes avanzados'],
    cta: 'Empezar ahora', highlighted: false, isEnterprise: false, sortOrder: 2,
    support: 'canales', onboarding: 'videos', whatsappNumber: '',
  },
  {
    name: 'Enterprise', price: '', monthlyPrice: null,
    description: 'Solución a medida para tu empresa.',
    moduleKeys: [],
    maxUsers: 0,
    extraFeatures: [
      'Todos los módulos disponibles',
      'Usuarios ilimitados',
      'Consultas ilimitadas',
      'Soporte dedicado',
      'Onboarding dedicado',
      'Factura personalizada',
      'SLA estándar (48-72 h)',
    ],
    cta: 'Cotizar', highlighted: false, isEnterprise: true, sortOrder: 3,
    support: 'dedicado', onboarding: 'dedicado', whatsappNumber: '573001234567',
  },
];

const defaultModules = [
  { key: 'transfercheck', name: 'TransferCheck', description: 'Verificación y validación de transferencias bancarias.', tier: 'free' as const, status: 'active' as const, defaultQuota: 100 },
  { key: 'antecedentes', name: 'AntecedentesCheck', description: 'Consulta de antecedentes judiciales, policiales y comerciales.', tier: 'premium' as const, status: 'coming_soon' as const, defaultQuota: 500 },
  { key: 'facturacion', name: 'Facturación Electrónica', description: 'Gestión de facturación electrónica y seguimiento de pagos.', tier: 'premium' as const, status: 'coming_soon' as const, defaultQuota: 500 },
  { key: 'cartera', name: 'Cartera', description: 'Gestión de cuentas de cobros, seguimiento de pagos y reconciliación.', tier: 'premium' as const, status: 'coming_soon' as const, defaultQuota: 500 },
];

async function createPurchase(
  workspaceId: unknown,
  plan: { _id: unknown; name: string; monthlyPrice: number | null; includedModules: { module: { key: string; tier: string; defaultQuota: number }; quotaOverride: number | null }[] },
) {
  const modules = plan.includedModules.map((pm) => ({
    moduleKey: pm.module.key,
    quota: pm.quotaOverride ?? pm.module.defaultQuota ?? 100,
    tier: pm.module.tier ?? 'free',
  }));

  await WorkspacePurchase.create({
    workspace: workspaceId,
    plan: plan._id,
    planName: plan.name,
    amount: plan.monthlyPrice || 0,
    currency: 'COP',
    status: 'active',
    paymentMethod: 'simulated',
    modules,
  });
}

export async function seed() {
  await dbConnect();

  const existing = await User.findOne({ email: 'admin@zentral.dev' });
  if (existing) {
    console.log('[seed] Already applied');
    return;
  }

  // ──── Superadmin ────
  const superAdmin = await User.create({
    email: 'admin@zentral.dev',
    passwordHash: await hashPassword('admin123'),
    name: 'Super Admin',
    role: 'superadmin',
    isActive: true,
  });
  console.log('[seed] SuperAdmin created');

  // ──── Modules ────
  for (const mod of defaultModules) {
    await Module.create(mod);
    console.log(`[seed] Module: ${mod.key} (${mod.tier}, ${mod.status})`);
  }
  const allModules = await Module.find().lean();

  // ──── Plans ────
  const planIds: Record<string, string> = {};
  for (const def of defaultPlanDefs) {
    const includedModules = def.moduleKeys
      .map((key) => {
        const mod = allModules.find((m) => m.key === key);
        return mod ? { module: mod._id, quotaOverride: null } : null;
      })
      .filter(Boolean);

    const plan = await Plan.create({
      name: def.name,
      price: def.price,
      monthlyPrice: def.monthlyPrice,
      description: def.description,
      includedModules,
      maxUsers: def.maxUsers,
      extraFeatures: def.extraFeatures,
      cta: def.cta,
      highlighted: def.highlighted,
      isEnterprise: def.isEnterprise,
      sortOrder: def.sortOrder,
      support: def.support,
      onboarding: def.onboarding,
      whatsappNumber: def.whatsappNumber,
    });

    plan.ctaLink = def.isEnterprise
      ? `https://wa.me/${def.whatsappNumber}?text=Hola%2C%20me%20interesa%20el%20plan%20Enterprise`
      : `/register?plan=${plan._id}`;
    await plan.save();

    planIds[def.name] = String(plan._id);
    console.log(`[seed] Plan: ${def.name} ($${def.monthlyPrice ?? 'a medida'})`);
  }

  // Resolve plans with modules populated
  const freePlan = await Plan.findById(planIds['Free']).populate('includedModules.module', 'key tier defaultQuota');
  const premiumPlan = await Plan.findById(planIds['Premium']).populate('includedModules.module', 'key tier defaultQuota');
  const plusPlan = await Plan.findById(planIds['Premium Plus']).populate('includedModules.module', 'key tier defaultQuota');

  if (!freePlan || !premiumPlan || !plusPlan) {
    throw new Error('Failed to resolve seed plans');
  }

  // ──── Workspace 1: Demo Corp (Free + Premium) ────
  const ws1 = await Workspace.create({
    name: 'Demo Corp',
    slug: 'demo-corp',
    isActive: true,
    isPayReady: true,
    plans: [freePlan._id, premiumPlan._id],
  });

  const admin1 = await User.create({
    email: 'admin@demo-corp.com',
    passwordHash: await hashPassword('demo123'),
    name: 'Admin Demo',
    role: 'admin',
    workspace: ws1._id,
    isActive: true,
    createdBy: superAdmin._id,
  });

  ws1.owner = admin1._id;
  await ws1.save();

  await createPurchase(ws1._id, freePlan!);
  await createPurchase(ws1._id, premiumPlan!);
  await recalculateQuotas(ws1._id);
  console.log('[seed] Workspace: Demo Corp (Free + Premium, $12/mes)');

  // ──── Workspace 2: Plus Corp (Free + Premium Plus) ────
  const ws2 = await Workspace.create({
    name: 'Plus Corp',
    slug: 'plus-corp',
    isActive: true,
    isPayReady: true,
    plans: [freePlan._id, plusPlan._id],
  });

  const admin2 = await User.create({
    email: 'admin@plus-corp.com',
    passwordHash: await hashPassword('plus123'),
    name: 'Admin Plus',
    role: 'admin',
    workspace: ws2._id,
    isActive: true,
    createdBy: superAdmin._id,
  });

  ws2.owner = admin2._id;
  await ws2.save();

  await createPurchase(ws2._id, freePlan!);
  await createPurchase(ws2._id, plusPlan!);
  await recalculateQuotas(ws2._id);
  console.log('[seed] Workspace: Plus Corp (Free + Premium Plus, $24/mes)');

  // ──── Operador in Plus Corp ────
  await User.create({
    email: 'operador@plus-corp.com',
    passwordHash: await hashPassword('operador123'),
    name: 'Usuario Operador',
    role: 'operador',
    workspace: ws2._id,
    isActive: true,
    createdBy: admin2._id,
  });
  console.log('[seed] Operador created (Plus Corp)');

  console.log('[seed] Complete ✓');
}
