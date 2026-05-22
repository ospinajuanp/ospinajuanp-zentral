import dbConnect from './db/mongoose';
import { User } from './models/user';
import { Workspace } from './models/workspace';
import { ModuleSubscription } from './models/module-subscription';
import { Module } from './models/module';
import { Plan } from './models/plan';
import { hashPassword } from './auth';

interface PlanSeed {
  name: string; price: string; monthlyPrice: number | null; description: string;
  moduleKeys: string[]; maxUsers: number; extraFeatures: string[];
  cta: string; ctaLink: string; highlighted: boolean; isEnterprise: boolean; sortOrder: number;
  support: string; onboarding: string; whatsappNumber: string;
}

const defaultPlanDefs: PlanSeed[] = [
  {
    name: 'Free', price: '$0', monthlyPrice: 0,
    description: 'Para empezar a usar Zentral.',
    moduleKeys: ['transfercheck'],
    maxUsers: 1,
    extraFeatures: [],
    cta: 'Empezar gratis', ctaLink: '/register?plan=FREE_PLAN_ID', highlighted: false, isEnterprise: false, sortOrder: 0,
    support: 'ninguno', onboarding: 'ninguno', whatsappNumber: '',
  },
  {
    name: 'Premium', price: '$12', monthlyPrice: 12,
    description: 'Para equipos que necesitan más.',
    moduleKeys: ['transfercheck', 'antecedentes', 'facturacion', 'cartera'],
    maxUsers: 5,
    extraFeatures: ['Módulos en beta gratis'],
    cta: 'Ver módulos', ctaLink: '/register?plan=PREMIUM_PLAN_ID', highlighted: true, isEnterprise: false, sortOrder: 1,
    support: 'email', onboarding: 'autoguiado', whatsappNumber: '',
  },
  {
    name: 'Enterprise', price: 'A medida', monthlyPrice: null,
    description: 'Solución personalizada para tu negocio.',
    moduleKeys: [],
    maxUsers: 0,
    extraFeatures: [
      'Todos los módulos disponibles',
      'Usuarios ilimitados',
      'Consultas ilimitadas',
      'Soporte prioritario',
      'Factura personalizada',
      'Onboarding dedicado',
      'SLA estándar (48-72 h)',
    ],
    cta: 'Cotizar', ctaLink: 'https://wa.me/573001234567?text=Hola%2C%20me%20interesa%20el%20plan%20Enterprise', highlighted: false, isEnterprise: true, sortOrder: 2,
    support: 'prioritario', onboarding: 'dedicado', whatsappNumber: '573001234567',
  },
];

const defaultModules = [
  {
    key: 'transfercheck',
    name: 'TransferCheck',
    description: 'Verificación y validación de transferencias bancarias en tiempo real.',
    tier: 'free' as const,
    status: 'active' as const,
    defaultQuota: 100,
  },
  {
    key: 'antecedentes',
    name: 'AntecedentesCheck',
    description: 'Consulta de antecedentes judiciales, policiales y comerciales.',
    tier: 'premium' as const,
    status: 'coming_soon' as const,
    defaultQuota: 500,
  },
  {
    key: 'facturacion',
    name: 'Facturación Electrónica',
    description: 'Gestión de facturación electrónica y seguimiento de pagos.',
    tier: 'premium' as const,
    status: 'coming_soon' as const,
    defaultQuota: 500,
  },
  {
    key: 'cartera',
    name: 'Cartera',
    description: 'Gestión de cuentas de cobros, seguimiento de pagos y reconciliación.',
    tier: 'premium' as const,
    status: 'coming_soon' as const,
    defaultQuota: 500,
  },
];

export async function seed() {
  await dbConnect();

  const existing = await User.findOne({ role: 'superadmin' });
  if (existing) {
    console.log('[seed] Already applied');
    return;
  }

  const superAdmin = await User.create({
    email: 'admin@zentral.dev',
    passwordHash: await hashPassword('admin123'),
    name: 'Super Admin',
    role: 'superadmin',
  });

  console.log('[seed] SuperAdmin created: admin@zentral.dev / admin123');

  const workspace = await Workspace.create({
    name: 'Demo Corp',
    slug: 'demo-corp',
    owner: superAdmin._id,
  });

  const admin = await User.create({
    email: 'admin@demo-corp.com',
    passwordHash: await hashPassword('demo123'),
    name: 'Admin Demo',
    role: 'admin',
    workspace: workspace._id,
    createdBy: superAdmin._id,
  });

  for (const mod of defaultModules) {
    await Module.create(mod);
    console.log(`[seed] Module created: ${mod.key}`);
  }

  const allModules = await Module.find().lean();

  const planMap: Record<string, string> = {};

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
      ctaLink: def.ctaLink,
      highlighted: def.highlighted,
      isEnterprise: def.isEnterprise,
      sortOrder: def.sortOrder,
      support: def.support,
      onboarding: def.onboarding,
      whatsappNumber: def.whatsappNumber,
    });
    planMap[def.name] = String(plan._id);
    console.log(`[seed] Plan created: ${def.name}`);
  }

  // Update plan CTA links with real IDs
  await Plan.updateMany({ name: 'Free' }, { ctaLink: `/register?plan=${planMap['Free']}` });
  await Plan.updateMany({ name: 'Premium' }, { ctaLink: `/register?plan=${planMap['Premium']}` });
  console.log('[seed] Plan CTA links updated with real IDs');

  // Create Premium plan reference
  const premiumPlan = await Plan.findOne({ name: 'Premium' }).lean();
  const freePlan = await Plan.findOne({ name: 'Free' }).lean();

  // Demo workspace: isPayReady=true, associated with Premium plan
  await Workspace.findByIdAndUpdate(workspace._id, {
    owner: admin._id,
    isPayReady: true,
    plan: premiumPlan?._id ?? null,
  });

  // Create subscriptions for demo workspace (Premium plan modules)
  const premiumModules = ['transfercheck', 'antecedentes', 'facturacion', 'cartera'];
  const subscriptionQuota = { transfercheck: 100, antecedentes: 500, facturacion: 500, cartera: 500 };

  for (const key of premiumModules) {
    const mod = allModules.find((m) => m.key === key);
    if (!mod) continue;
    await ModuleSubscription.create({
      workspace: workspace._id,
      moduleKey: key,
      tier: mod.tier as 'free' | 'premium',
      status: 'active',
      monthlyQuota: subscriptionQuota[key as keyof typeof subscriptionQuota] ?? mod.defaultQuota,
      usedQuota: 0,
      quotaResetAt: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1),
    });
    console.log(`[seed] Subscription created: ${key} for demo workspace`);
  }

  // Create a free workspace with Free plan (for testing registration flow)
  const freeWorkspace = await Workspace.create({
    name: 'Free Test',
    slug: 'free-test',
    owner: null,
    isPayReady: true,
    plan: freePlan?._id ?? null,
  });

  const freeModule = allModules.find((m) => m.key === 'transfercheck');
  if (freeModule) {
    await ModuleSubscription.create({
      workspace: freeWorkspace._id,
      moduleKey: 'transfercheck',
      tier: 'free',
      status: 'active',
      monthlyQuota: freeModule.defaultQuota,
      usedQuota: 0,
      quotaResetAt: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1),
    });
    console.log('[seed] Free test workspace created');
  }

  // Create a pending payment workspace (for testing isPayReady=false)
  const pendingWorkspace = await Workspace.create({
    name: 'Pending Corp',
    slug: 'pending-corp',
    owner: null,
    isPayReady: false,
    plan: premiumPlan?._id ?? null,
  });

  for (const key of premiumModules) {
    const mod = allModules.find((m) => m.key === key);
    if (!mod) continue;
    await ModuleSubscription.create({
      workspace: pendingWorkspace._id,
      moduleKey: key,
      tier: mod.tier as 'free' | 'premium',
      status: 'inactive',
      monthlyQuota: subscriptionQuota[key as keyof typeof subscriptionQuota] ?? mod.defaultQuota,
      usedQuota: 0,
      quotaResetAt: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1),
    });
  }
  console.log('[seed] Pending payment workspace created (for testing)');

  console.log('[seed] Demo workspace updated: isPayReady=true, plan=Premium');
  console.log('[seed] Complete');
}