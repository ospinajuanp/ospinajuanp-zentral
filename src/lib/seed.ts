import dbConnect from './db/mongoose';
import { User } from './models/user';
import { Workspace } from './models/workspace';
import { ModuleSubscription } from './models/module-subscription';

export async function seed() {
  await dbConnect();

  const existingSuperAdmin = await User.findOne({ role: 'superadmin' });
  if (existingSuperAdmin) {
    console.log('[seed] Already applied');
    return;
  }

  // Create SuperAdmin
  const superAdmin = await User.create({
    email: 'admin@zentral.dev',
    passwordHash: '', // TODO: hash with bcrypt before using
    name: 'Super Admin',
    role: 'superadmin',
  });

  // Create demo workspace
  const workspace = await Workspace.create({
    name: 'Demo Corp',
    slug: 'demo-corp',
    owner: superAdmin._id,
  });

  // Create Admin-Empresa
  const admin = await User.create({
    email: 'admin@demo-corp.com',
    passwordHash: '', // TODO: hash with bcrypt before using
    name: 'Admin Demo',
    role: 'admin',
    workspace: workspace._id,
    createdBy: superAdmin._id,
  });

  // Activate TransferCheck module (free tier)
  await ModuleSubscription.create({
    workspace: workspace._id,
    moduleKey: 'transfercheck',
    tier: 'free',
    status: 'active',
  });

  // Update workspace owner
  workspace.owner = admin._id;
  await workspace.save();

  console.log('[seed] Complete — SuperAdmin, demo workspace, and TransferCheck module created');
}
