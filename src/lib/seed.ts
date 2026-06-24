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
  moduleKeys: string[]; moduleQuotaOverrides: Record<string, number>; maxUsers: number; extraFeatures: string[];
  cta: string; highlighted: boolean; isEnterprise: boolean; sortOrder: number;
  support: string; onboarding: string; whatsappNumber: string;
}

const defaultPlanDefs: PlanSeed[] = [
  {
    name: 'Free', price: '$0', monthlyPrice: 0,
    description: 'Para empezar a usar Zentral.',
    moduleKeys: ['transfercheck', 'personalfinance'],
    moduleQuotaOverrides: { transfercheck: 200, personalfinance: 200 },
    maxUsers: 1,
    extraFeatures: [],
    cta: 'Empezar gratis', highlighted: false, isEnterprise: false, sortOrder: 0,
    support: 'ninguno', onboarding: 'ninguno', whatsappNumber: '',
  },
  {
    name: '$2 TransferCheck', price: '$2', monthlyPrice: 2,
    description: 'Para usuarios que necesitan más consultas de TransferCheck.',
    moduleKeys: ['transfercheck'],
    moduleQuotaOverrides: { transfercheck: 1000 },
    maxUsers: 1,
    extraFeatures: [],
    cta: 'Elegir plan', highlighted: true, isEnterprise: false, sortOrder: 1,
    support: 'email', onboarding: 'ninguno', whatsappNumber: '',
  },
  {
    name: '$2 Personal Finance', price: '$2', monthlyPrice: 2,
    description: 'Para usuarios que necesitan más consultas de Finanzas Personales.',
    moduleKeys: ['personalfinance'],
    moduleQuotaOverrides: { personalfinance: 1000 },
    maxUsers: 1,
    extraFeatures: [],
    cta: 'Elegir plan', highlighted: false, isEnterprise: false, sortOrder: 2,
    support: 'email', onboarding: 'ninguno', whatsappNumber: '',
  },
  {
    name: '$5', price: '$5', monthlyPrice: 5,
    description: 'Máxima potencia con ambos módulos.',
    moduleKeys: ['transfercheck', 'personalfinance'],
    moduleQuotaOverrides: { transfercheck: 1500, personalfinance: 1500 },
    maxUsers: 5,
    extraFeatures: ['Reportes avanzados'],
    cta: 'Elegir plan', highlighted: false, isEnterprise: false, sortOrder: 3,
    support: 'canales', onboarding: 'autoguiado', whatsappNumber: '',
  },
  {
    name: 'Enterprise', price: '', monthlyPrice: null,
    description: 'Solución a medida para tu empresa.',
    moduleKeys: [],
    moduleQuotaOverrides: {},
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
    cta: 'Cotizar', highlighted: false, isEnterprise: true, sortOrder: 4,
    support: 'dedicado', onboarding: 'dedicado', whatsappNumber: '573001234567',
  },
];

const defaultModules = [
  { key: 'transfercheck', name: 'TransferCheck', description: 'Verificación y validación de transferencias bancarias.', tier: 'free' as const, status: 'active' as const, defaultQuota: 100, visible: true },
  { key: 'personalfinance', name: 'Finanzas Personales', description: 'Gestión de finanzas personales, ingresos, gastos, deudas, metas de ahorro y simuladores.', tier: 'free' as const, status: 'active' as const, defaultQuota: 200, visible: true },
  { key: 'antecedentes', name: 'AntecedentesCheck', description: 'Consulta de antecedentes judiciales, policiales y comerciales.', tier: 'premium' as const, status: 'coming_soon' as const, defaultQuota: 500, visible: false },
  { key: 'facturacion', name: 'Facturación Electrónica', description: 'Gestión de facturación electrónica y seguimiento de pagos.', tier: 'premium' as const, status: 'coming_soon' as const, defaultQuota: 500, visible: false },
  { key: 'cartera', name: 'Cartera', description: 'Gestión de cuentas de cobros, seguimiento de pagos y reconciliación.', tier: 'premium' as const, status: 'coming_soon' as const, defaultQuota: 500, visible: false },
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
        return mod ? { module: mod._id, quotaOverride: def.moduleQuotaOverrides[key] ?? null } : null;
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
  const transferCheckPlan = await Plan.findById(planIds['$2 TransferCheck']).populate('includedModules.module', 'key tier defaultQuota');
  const personalFinancePlan = await Plan.findById(planIds['$2 Personal Finance']).populate('includedModules.module', 'key tier defaultQuota');
  const proPlan = await Plan.findById(planIds['$5']).populate('includedModules.module', 'key tier defaultQuota');

  if (!freePlan || !transferCheckPlan || !personalFinancePlan || !proPlan) {
    throw new Error('Failed to resolve seed plans');
  }

  // ──── Workspace 1: Demo Corp (Free) ────
  const ws1 = await Workspace.create({
    name: 'Demo Corp',
    slug: 'demo-corp',
    isActive: true,
    isPayReady: true,
    plans: [freePlan._id],
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
  await recalculateQuotas(ws1._id);
  console.log('[seed] Workspace: Demo Corp (Free)');

  // ──── Workspace 2: Plus Corp (Free + $5) ────
  const ws2 = await Workspace.create({
    name: 'Plus Corp',
    slug: 'plus-corp',
    isActive: true,
    isPayReady: true,
    plans: [freePlan._id, proPlan._id],
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
  await createPurchase(ws2._id, proPlan!);
  await recalculateQuotas(ws2._id);
  console.log('[seed] Workspace: Plus Corp (Free + $5)');
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
