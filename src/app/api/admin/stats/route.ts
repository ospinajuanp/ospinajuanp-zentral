import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import dbConnect from '@/lib/db/mongoose';
import { Module } from '@/lib/models/module';
import { Plan } from '@/lib/models/plan';
import { Workspace } from '@/lib/models/workspace';
import { User } from '@/lib/models/user';
import { ModuleSubscription } from '@/lib/models/module-subscription';
import { getApiAuth } from '@/lib/auth/api';

export async function GET(req: NextRequest) {
  try {
    const auth = await getApiAuth(req);
    if (!auth || auth.role !== 'superadmin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    await dbConnect();

    const [
      allModules,
      allPlans,
      allWorkspaces,
      allUsers,
      allSubscriptions,
    ] = await Promise.all([
      Module.find().lean(),
      Plan.find().lean(),
      Workspace.find().lean(),
      User.find().lean(),
      ModuleSubscription.find().lean(),
    ]);

    // Module stats
    const totalModules = allModules.length;
    const activeModules = allModules.filter((m) => m.status === 'active').length;
    const inactiveModules = allModules.filter((m) => m.status === 'inactive').length;
    const comingSoonModules = allModules.filter((m) => m.status === 'coming_soon').length;
    const freeModules = allModules.filter((m) => m.tier === 'free').length;
    const premiumModules = allModules.filter((m) => m.tier === 'premium').length;

    // Plan stats
    const activePlans = allPlans.filter((p) => p.isActive).length;
    const enterprisePlans = allPlans.filter((p) => p.isEnterprise).length;
    const highlightedPlans = allPlans.filter((p) => p.highlighted).length;

    // Workspace stats
    const totalWorkspaces = allWorkspaces.length;
    const activeWorkspaces = allWorkspaces.filter((w) => w.isActive).length;
    const inactiveWorkspaces = allWorkspaces.filter((w) => !w.isActive).length;
    const payReadyWorkspaces = allWorkspaces.filter((w) => w.isPayReady).length;
    const pendingPaymentWorkspaces = allWorkspaces.filter((w) => !w.isPayReady).length;

    // User stats
    const totalUsers = allUsers.length;
    const activeUsers = allUsers.filter((u) => u.isActive).length;
    const inactiveUsers = allUsers.filter((u) => !u.isActive).length;
    const superadmins = allUsers.filter((u) => u.role === 'superadmin').length;
    const admins = allUsers.filter((u) => u.role === 'admin').length;
    const operadores = allUsers.filter((u) => u.role === 'operador' || u.role === 'hijo').length;

    // Subscription stats
    const activeSubscriptions = allSubscriptions.filter((s) => s.status === 'active').length;
    const inactiveSubscriptions = allSubscriptions.filter((s) => s.status === 'inactive').length;
    const freeTierSubs = allSubscriptions.filter((s) => s.tier === 'free').length;
    const premiumTierSubs = allSubscriptions.filter((s) => s.tier === 'premium').length;

    // Billing
    let mrr = 0;
    for (const ws of allWorkspaces) {
      if (!ws.isActive || !ws.isPayReady) continue;
      if (!ws.plan) continue;
      const plan = allPlans.find((p) => String(p._id) === String(ws.plan));
      if (plan && plan.monthlyPrice) {
        mrr += plan.monthlyPrice;
      }
    }

    return NextResponse.json({
      modules: {
        total: totalModules,
        active: activeModules,
        inactive: inactiveModules,
        comingSoon: comingSoonModules,
        free: freeModules,
        premium: premiumModules,
      },
      plans: {
        total: allPlans.length,
        active: activePlans,
        enterprise: enterprisePlans,
        highlighted: highlightedPlans,
      },
      workspaces: {
        total: totalWorkspaces,
        active: activeWorkspaces,
        inactive: inactiveWorkspaces,
        payReady: payReadyWorkspaces,
        pendingPayment: pendingPaymentWorkspaces,
      },
      users: {
        total: totalUsers,
        active: activeUsers,
        inactive: inactiveUsers,
        superadmins,
        admins,
        operadores,
      },
      subscriptions: {
        total: allSubscriptions.length,
        active: activeSubscriptions,
        inactive: inactiveSubscriptions,
        free: freeTierSubs,
        premium: premiumTierSubs,
      },
      billing: {
        mrr,
        paidSubscriptions: premiumTierSubs,
        freeSubscriptions: freeTierSubs,
      },
    });
  } catch {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}