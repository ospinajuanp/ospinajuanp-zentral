import dbConnect from './db/mongoose';
import { User } from './models/user';
import { Workspace } from './models/workspace';
import { ModuleSubscription } from './models/module-subscription';
import { hashPassword } from './auth';

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

  await ModuleSubscription.create({
    workspace: workspace._id,
    moduleKey: 'transfercheck',
    tier: 'free',
    status: 'active',
  });

  workspace.owner = admin._id;
  await workspace.save();

  console.log('[seed] Demo workspace created: admin@demo-corp.com / demo123');
  console.log('[seed] Complete');
}
