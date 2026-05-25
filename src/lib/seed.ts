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
  { key: 'transfercheck', name: 'TransferCheck', description: 'Verificación y validación de transferencias bancarias en tiempo real.', tier: 'free' as const, status: 'active' as const, defaultQuota: 100 },
  { key: 'antecedentes', name: 'AntecedentesCheck', description: 'Consulta de antecedentes judiciales, policiales y comerciales.', tier: 'premium' as const, status: 'coming_soon' as const, defaultQuota: 500 },
  { key: 'facturacion', name: 'Facturación Electrónica', description: 'Gestión de facturación electrónica y seguimiento de pagos.', tier: 'premium' as const, status: 'coming_soon' as const, defaultQuota: 500 },
  { key: 'cartera', name: 'Cartera', description: 'Gestión de cuentas de cobros, seguimiento de pagos y reconciliación.', tier: 'premium' as const, status: 'coming_soon' as const, defaultQuota: 500 },
];

const subscriptionQuotas: Record<string, number> = { transfercheck: 100, antecedentes: 500, facturacion: 500, cartera: 500 };

async function createSubscriptions(workspaceId: unknown, moduleKeys: string[], allModules: Record<string, unknown>[], status: string) {
  for (const key of moduleKeys) {
    const mod = allModules.find((m) => m.key === key);
    if (!mod) continue;
    await ModuleSubscription.create({
      workspace: workspaceId,
      moduleKey: key,
      tier: mod.tier,
      status,
      monthlyQuota: subscriptionQuotas[key] ?? mod.defaultQuota,
      usedQuota: 0,
      quotaResetAt: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1),
    });
  }
}

export async function seed() {
  await dbConnect();

  const existing = await User.findOne({ email: 'admin@zentral.dev' });
  if (existing) {
    console.log('[seed] Already applied');
    return;
  }

  // ──── Users ────
  const superAdmin = await User.create({
    email: 'admin@zentral.dev',
    passwordHash: await hashPassword('admin123'),
    name: 'Super Admin',
    role: 'superadmin',
    isActive: true,
  });
  console.log('[seed] SuperAdmin: admin@zentral.dev / admin123');

  // ──── Modules ────
  for (const mod of defaultModules) {
    await Module.create(mod);
    console.log(`[seed] Module: ${mod.key} (${mod.status})`);
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

    planIds[def.name] = String(plan._id);
    console.log(`[seed] Plan: ${def.name}`);

    // Update ctaLink after creation (needs plan._id)
    const isEnterprise = def.isEnterprise;
    if (!isEnterprise) {
      plan.ctaLink = `/register?plan=${plan._id}`;
    } else {
      plan.ctaLink = `https://wa.me/${def.whatsappNumber}?text=Hola%2C%20me%20interesa%20el%20plan%20Enterprise`;
    }
    await plan.save();
  }

  // ──── Workspace 1: Demo Corp (Premium) ────
  const premiumPlanId = planIds['Premium'];
  const ws1 = await Workspace.create({
    name: 'Demo Corp',
    slug: 'demo-corp',
    isActive: true,
    isPayReady: true,
    plan: premiumPlanId,
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

  await createSubscriptions(ws1._id, ['transfercheck', 'antecedentes', 'facturacion', 'cartera'], allModules, 'active');
  console.log('[seed] Workspace: Demo Corp → admin@demo-corp.com / demo123 (Premium)');

  // ──── Workspace 2: Plus Corp (Premium Plus) ────
  const plusPlanId = planIds['Premium Plus'];
  const ws2 = await Workspace.create({
    name: 'Plus Corp',
    slug: 'plus-corp',
    isActive: true,
    isPayReady: true,
    plan: plusPlanId,
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

  await createSubscriptions(ws2._id, ['transfercheck', 'antecedentes', 'facturacion', 'cartera'], allModules, 'active');
  console.log('[seed] Workspace: Plus Corp → admin@plus-corp.com / plus123 (Premium Plus)');

  // ──── Hijo user in Plus Corp ────
  await User.create({
    email: 'operador@plus-corp.com',
    passwordHash: await hashPassword('operador123'),
    name: 'Usuario Operador',
    role: 'operador',
    workspace: ws2._id,
    isActive: true,
    createdBy: admin2._id,
  });
  console.log('[seed] Operador: operador@plus-corp.com / operador123 (Plus Corp)');

  console.log('[seed] Complete ✓');
}
