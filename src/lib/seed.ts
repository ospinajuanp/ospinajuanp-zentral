import dbConnect from './db/mongoose';
import { User } from './models/user';
import { Workspace } from './models/workspace';
import { ModuleSubscription } from './models/module-subscription';
import { Module } from './models/module';
import { hashPassword } from './auth';

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

  await ModuleSubscription.create({
    workspace: workspace._id,
    moduleKey: 'transfercheck',
    tier: 'free',
    status: 'active',
    monthlyQuota: 100,
    usedQuota: 0,
    quotaResetAt: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1),
  });

  workspace.owner = admin._id;
  await workspace.save();

  console.log('[seed] Demo workspace created: admin@demo-corp.com / demo123');
  console.log('[seed] Complete');
}
