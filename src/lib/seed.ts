import dbConnect from './db/mongoose';
import { User } from './models/user';
import { Workspace } from './models/workspace';
import { Module } from './models/module';
import { Plan } from './models/plan';
import { WorkspacePurchase } from './models/workspace-purchase';
import { recalculateQuotas } from './purchase/recalculate-quotas';
import { hashPassword } from './auth';
import { PersonalFinanceSummary } from './models/personalfinance-summary';
import { PersonalFinanceIncome } from './models/personalfinance-income';
import { PersonalFinanceExpense } from './models/personalfinance-expense';
import { PersonalFinanceDebt } from './models/personalfinance-debt';
import { DebtPayment } from './models/debt-payment';
import { EmergencyFund } from './models/emergency-fund';
import { SavingsInvestment } from './models/savings-investment';
import { recalculateFinancialPosition } from './modules/personalfinance/financial-position';

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

  // ═══════════════════════════════════════════════════════════════════
  // PERSONAL FINANCE TEST DATA (Demo Corp workspace)
  // ═══════════════════════════════════════════════════════════════════

  const pfUser = admin1._id;

  // ──── PersonalFinanceSummary ────
  await PersonalFinanceSummary.create({
    workspace: ws1._id,
    user: pfUser,
    currency: 'COP',
    billingCycleDay: 1,
  });
  console.log('[seed] PersonalFinanceSummary created (Demo Corp)');

  // ──── Ingresos (últimos 6 meses) ────
  const incomeData = [
    { month: -5, type: 'recurrent' as const, category: 'Salario', amount: 3500000, description: 'Nómina mensual' },
    { month: -4, type: 'recurrent' as const, category: 'Salario', amount: 3500000, description: 'Nómina mensual' },
    { month: -3, type: 'recurrent' as const, category: 'Salario', amount: 3500000, description: 'Nómina mensual' },
    { month: -2, type: 'recurrent' as const, category: 'Salario', amount: 3500000, description: 'Nómina mensual' },
    { month: -1, type: 'recurrent' as const, category: 'Salario', amount: 3500000, description: 'Nómina mensual' },
    { month: 0, type: 'recurrent' as const, category: 'Salario', amount: 3500000, description: 'Nómina mensual' },
    { month: -3, type: 'occasional' as const, category: 'Freelance', amount: 800000, description: 'Proyecto freelance' },
    { month: -1, type: 'occasional' as const, category: 'Inversiones', amount: 150000, description: 'Dividendos' },
  ];

  for (const inc of incomeData) {
    const date = new Date();
    date.setMonth(date.getMonth() + inc.month);
    await PersonalFinanceIncome.create({
      workspace: ws1._id,
      user: pfUser,
      type: inc.type,
      category: inc.category,
      amount: inc.amount,
      currency: 'COP',
      description: inc.description,
      date,
    });
  }
  console.log('[seed] PersonalFinanceIncome: 8 records created');

  // ──── Gastos (últimos 6 meses) ────
  const expenseData = [
    // Mes actual
    { month: 0, type: 'obligatory' as const, category: 'Arriendo/Hipoteca', amount: 1200000, description: 'Arriendo apartamento' },
    { month: 0, type: 'obligatory' as const, category: 'Servicios', amount: 250000, description: 'Servicios públicos' },
    { month: 0, type: 'obligatory' as const, category: 'Alimentación/Hogar', amount: 600000, description: 'Supermercado' },
    { month: 0, type: 'obligatory' as const, category: 'Transporte', amount: 300000, description: 'Transporte público y gasolina' },
    { month: 0, type: 'obligatory' as const, category: 'Salud/Seguros', amount: 200000, description: 'EPS y medicina' },
    { month: 0, type: 'savings_investment' as const, category: 'Fondo de Emergencia', amount: 350000, description: 'Ahorro mensual fondo emergencia' },
    { month: 0, type: 'discretionary' as const, category: 'Entretenimiento', amount: 150000, description: 'Streaming y salidas' },
    // Mes pasado
    { month: -1, type: 'obligatory' as const, category: 'Arriendo/Hipoteca', amount: 1200000, description: 'Arriendo apartamento' },
    { month: -1, type: 'obligatory' as const, category: 'Servicios', amount: 280000, description: 'Servicios públicos' },
    { month: -1, type: 'obligatory' as const, category: 'Alimentación/Hogar', amount: 550000, description: 'Supermercado' },
    { month: -1, type: 'obligatory' as const, category: 'Transporte', amount: 300000, description: 'Transporte público' },
    { month: -1, type: 'obligatory' as const, category: 'Salud/Seguros', amount: 200000, description: 'EPS' },
    { month: -1, type: 'savings_investment' as const, category: 'Fondo de Emergencia', amount: 350000, description: 'Ahorro mensual' },
    { month: -1, type: 'discretionary' as const, category: 'Entretenimiento', amount: 180000, description: 'Cine y restaurantes' },
    // Hace 2 meses
    { month: -2, type: 'obligatory' as const, category: 'Arriendo/Hipoteca', amount: 1200000, description: 'Arriendo' },
    { month: -2, type: 'obligatory' as const, category: 'Servicios', amount: 220000, description: 'Servicios' },
    { month: -2, type: 'obligatory' as const, category: 'Alimentación/Hogar', amount: 500000, description: 'Supermercado' },
    { month: -2, type: 'obligatory' as const, category: 'Transporte', amount: 300000, description: 'Transporte' },
    { month: -2, type: 'obligatory' as const, category: 'Salud/Seguros', amount: 200000, description: 'EPS' },
    { month: -2, type: 'savings_investment' as const, category: 'Fondo de Emergencia', amount: 350000, description: 'Ahorro mensual' },
    // Hace 3 meses
    { month: -3, type: 'obligatory' as const, category: 'Arriendo/Hipoteca', amount: 1200000, description: 'Arriendo' },
    { month: -3, type: 'obligatory' as const, category: 'Servicios', amount: 250000, description: 'Servicios' },
    { month: -3, type: 'obligatory' as const, category: 'Alimentación/Hogar', amount: 480000, description: 'Supermercado' },
    { month: -3, type: 'obligatory' as const, category: 'Transporte', amount: 300000, description: 'Transporte' },
    { month: -3, type: 'obligatory' as const, category: 'Salud/Seguros', amount: 200000, description: 'EPS' },
    { month: -3, type: 'savings_investment' as const, category: 'Fondo de Emergencia', amount: 350000, description: 'Ahorro mensual' },
    { month: -3, type: 'discretionary' as const, category: 'Viajes', amount: 500000, description: 'Pasaje vuelo' },
    // Hace 4 meses
    { month: -4, type: 'obligatory' as const, category: 'Arriendo/Hipoteca', amount: 1200000, description: 'Arriendo' },
    { month: -4, type: 'obligatory' as const, category: 'Servicios', amount: 230000, description: 'Servicios' },
    { month: -4, type: 'obligatory' as const, category: 'Alimentación/Hogar', amount: 520000, description: 'Supermercado' },
    { month: -4, type: 'obligatory' as const, category: 'Transporte', amount: 300000, description: 'Transporte' },
    { month: -4, type: 'obligatory' as const, category: 'Salud/Seguros', amount: 200000, description: 'EPS' },
    { month: -4, type: 'savings_investment' as const, category: 'Fondo de Emergencia', amount: 350000, description: 'Ahorro mensual' },
    // Hace 5 meses
    { month: -5, type: 'obligatory' as const, category: 'Arriendo/Hipoteca', amount: 1200000, description: 'Arriendo' },
    { month: -5, type: 'obligatory' as const, category: 'Servicios', amount: 260000, description: 'Servicios' },
    { month: -5, type: 'obligatory' as const, category: 'Alimentación/Hogar', amount: 500000, description: 'Supermercado' },
    { month: -5, type: 'obligatory' as const, category: 'Transporte', amount: 300000, description: 'Transporte' },
    { month: -5, type: 'obligatory' as const, category: 'Salud/Seguros', amount: 200000, description: 'EPS' },
    { month: -5, type: 'savings_investment' as const, category: 'Fondo de Emergencia', amount: 350000, description: 'Ahorro mensual' },
  ];

  const emergencyFundExpense = await PersonalFinanceExpense.create({
    workspace: ws1._id,
    user: pfUser,
    type: 'savings_investment',
    category: 'Fondo de Emergencia',
    amount: 350000,
    currency: 'COP',
    isRecurrent: true,
    recurringPeriod: 'monthly',
    description: 'Ahorro mensual fondo emergencia',
    date: new Date(),
    emergencyFundTarget: 6300000,
    monthsToEmergencyFund: 18,
  });

  for (const exp of expenseData) {
    const date = new Date();
    date.setMonth(date.getMonth() + exp.month);
    await PersonalFinanceExpense.create({
      workspace: ws1._id,
      user: pfUser,
      type: exp.type,
      category: exp.category,
      amount: exp.amount,
      currency: 'COP',
      isRecurrent: true,
      recurringPeriod: 'monthly',
      description: exp.description,
      date,
    });
  }
  console.log('[seed] PersonalFinanceExpense: 37 records created');

  // ──── Deudas ────
  const debt1 = await PersonalFinanceDebt.create({
    workspace: ws1._id,
    user: pfUser,
    debtType: 'credit_card',
    creditor: 'Banco Bogotá - Visa',
    originalAmount: 5000000,
    currentBalance: 2500000,
    currency: 'COP',
    interestRate: 3.5,
    monthlyPayment: 250000,
    startDate: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
    expectedEndDate: new Date(Date.now() + 12 * 30 * 24 * 60 * 60 * 1000),
    status: 'active',
    notes: 'Tarjeta de crédito principal',
  });

  const debt2 = await PersonalFinanceDebt.create({
    workspace: ws1._id,
    user: pfUser,
    debtType: 'personal_loan',
    creditor: 'Banco Davivienda',
    originalAmount: 10000000,
    currentBalance: 7500000,
    currency: 'COP',
    interestRate: 1.8,
    monthlyPayment: 500000,
    startDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
    expectedEndDate: new Date(Date.now() + 18 * 30 * 24 * 60 * 60 * 1000),
    status: 'active',
    notes: 'Préstamo personal',
  });

  const debt3 = await PersonalFinanceDebt.create({
    workspace: ws1._id,
    user: pfUser,
    debtType: 'vehicle_loan',
    creditor: 'FinAutomotriz',
    originalAmount: 45000000,
    currentBalance: 38000000,
    currency: 'COP',
    interestRate: 1.2,
    monthlyPayment: 1200000,
    startDate: new Date(Date.now() - 400 * 24 * 60 * 60 * 1000),
    expectedEndDate: new Date(Date.now() + 36 * 30 * 24 * 60 * 60 * 1000),
    status: 'active',
    notes: 'Préstamo vehicular',
  });

  console.log('[seed] PersonalFinanceDebt: 3 debts created');

  // ──── DebtPayments (histórico de pagos) ────
  const paymentData = [
    { debtId: debt1._id, monthsAgo: 5, amount: 280000, principal: 192500, interest: 87500 },
    { debtId: debt1._id, monthsAgo: 4, amount: 280000, principal: 195000, interest: 85000 },
    { debtId: debt1._id, monthsAgo: 3, amount: 280000, principal: 197500, interest: 82500 },
    { debtId: debt1._id, monthsAgo: 2, amount: 280000, principal: 200000, interest: 80000 },
    { debtId: debt1._id, monthsAgo: 1, amount: 280000, principal: 202500, interest: 77500 },
    { debtId: debt2._id, monthsAgo: 11, amount: 550000, principal: 370000, interest: 180000 },
    { debtId: debt2._id, monthsAgo: 10, amount: 550000, principal: 373500, interest: 176500 },
    { debtId: debt2._id, monthsAgo: 9, amount: 550000, principal: 377000, interest: 173000 },
    { debtId: debt2._id, monthsAgo: 8, amount: 550000, principal: 380500, interest: 169500 },
    { debtId: debt2._id, monthsAgo: 7, amount: 550000, principal: 384000, interest: 166000 },
    { debtId: debt2._id, monthsAgo: 6, amount: 550000, principal: 387500, interest: 162500 },
    { debtId: debt2._id, monthsAgo: 5, amount: 550000, principal: 391000, interest: 159000 },
    { debtId: debt2._id, monthsAgo: 4, amount: 550000, principal: 394500, interest: 155500 },
    { debtId: debt2._id, monthsAgo: 3, amount: 550000, principal: 398000, interest: 152000 },
    { debtId: debt2._id, monthsAgo: 2, amount: 550000, principal: 401500, interest: 148500 },
    { debtId: debt2._id, monthsAgo: 1, amount: 550000, principal: 405000, interest: 145000 },
    { debtId: debt3._id, monthsAgo: 13, amount: 1250000, principal: 1060000, interest: 190000 },
    { debtId: debt3._id, monthsAgo: 12, amount: 1250000, principal: 1063000, interest: 187000 },
    { debtId: debt3._id, monthsAgo: 11, amount: 1250000, principal: 1066000, interest: 184000 },
    { debtId: debt3._id, monthsAgo: 10, amount: 1250000, principal: 1069000, interest: 181000 },
    { debtId: debt3._id, monthsAgo: 9, amount: 1250000, principal: 1072000, interest: 178000 },
    { debtId: debt3._id, monthsAgo: 8, amount: 1250000, principal: 1075000, interest: 175000 },
    { debtId: debt3._id, monthsAgo: 7, amount: 1250000, principal: 1078000, interest: 172000 },
    { debtId: debt3._id, monthsAgo: 6, amount: 1250000, principal: 1081000, interest: 169000 },
    { debtId: debt3._id, monthsAgo: 5, amount: 1250000, principal: 1084000, interest: 166000 },
    { debtId: debt3._id, monthsAgo: 4, amount: 1250000, principal: 1087000, interest: 163000 },
    { debtId: debt3._id, monthsAgo: 3, amount: 1250000, principal: 1090000, interest: 160000 },
    { debtId: debt3._id, monthsAgo: 2, amount: 1250000, principal: 1093000, interest: 157000 },
    { debtId: debt3._id, monthsAgo: 1, amount: 1250000, principal: 1096000, interest: 154000 },
  ];

  for (const pay of paymentData) {
    const date = new Date();
    date.setMonth(date.getMonth() - pay.monthsAgo);
    await DebtPayment.create({
      workspace: ws1._id,
      user: pfUser,
      debtId: pay.debtId,
      amount: pay.amount,
      principalPortion: pay.principal,
      interestPortion: pay.interest,
      balanceAfter: 0,
      paymentDate: date,
    });
  }
  console.log('[seed] DebtPayment: 32 payments created');

  // ──── EmergencyFund ────
  await EmergencyFund.create({
    workspace: ws1._id,
    user: pfUser,
    linkedExpenseId: emergencyFundExpense._id,
    savedAmount: 2100000,
    monthsCompleted: 6,
    lastUpdated: new Date(),
  });
  console.log('[seed] EmergencyFund: created');

  // ──── SavingsInvestments ────
  await SavingsInvestment.create({
    workspace: ws1._id,
    user: pfUser,
    name: 'CDT Bancolombia',
    type: 'CDT',
    initialAmount: 5000000,
    currentBalance: 5350000,
    interestRate: 10.5,
    interestFrequency: 'annually',
    startDate: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
    expectedEndDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
    lastInterestCalculation: new Date(),
    status: 'active',
  });

  await SavingsInvestment.create({
    workspace: ws1._id,
    user: pfUser,
    name: 'Fondo ETFs - Skandia',
    type: 'investment',
    initialAmount: 3000000,
    currentBalance: 4200000,
    interestRate: 12.0,
    interestFrequency: 'monthly',
    startDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
    lastInterestCalculation: new Date(),
    status: 'active',
    notes: 'Portafolio diversificado en ETFs',
  });

  await SavingsInvestment.create({
    workspace: ws1._id,
    user: pfUser,
    name: 'Cesantías Protección',
    type: 'pension',
    initialAmount: 2500000,
    currentBalance: 3200000,
    interestRate: 8.0,
    interestFrequency: 'annually',
    startDate: new Date(Date.now() - 400 * 24 * 60 * 60 * 1000),
    lastInterestCalculation: new Date(),
    status: 'active',
  });

  await SavingsInvestment.create({
    workspace: ws1._id,
    user: pfUser,
    name: 'Fondo Voluntario Colpatria',
    type: 'savings',
    initialAmount: 1000000,
    currentBalance: 1500000,
    interestRate: 5.5,
    interestFrequency: 'monthly',
    startDate: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000),
    lastInterestCalculation: new Date(),
    status: 'active',
  });

  console.log('[seed] SavingsInvestment: 4 investments created');

  // ──── FinancialPosition (recalculate) ────
  await recalculateFinancialPosition(ws1._id, pfUser);
  console.log('[seed] FinancialPosition: calculated and created');

  console.log('[seed] Complete ✓');
}
