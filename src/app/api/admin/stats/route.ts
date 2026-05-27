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
      wTotal, wActive, wPayReady, wPending,
      mActive,
      uTotal, uActive,
      sActive, sPlan, sEnterprise,
      payReadyWorkspaces,
      allPlans,
    ] = await Promise.all([
      Workspace.countDocuments(),
      Workspace.countDocuments({ isActive: true }),
      Workspace.countDocuments({ isPayReady: true }),
      Workspace.countDocuments({ isPayReady: false, isActive: true }),
      Module.countDocuments({ status: 'active' }),
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      ModuleSubscription.countDocuments({ status: 'active' }),
      ModuleSubscription.countDocuments({ status: 'active', tier: { $ne: 'enterprise' } }),
      ModuleSubscription.countDocuments({ status: 'active', tier: 'enterprise' }),
      Workspace.find({ isActive: true, isPayReady: true }, 'plans').lean(),
      Plan.find({ isActive: true }, 'monthlyPrice').lean(),
    ]);

    const paidPlanIds = new Map(allPlans.filter((p) => p.monthlyPrice && p.monthlyPrice > 0).map((p) => [String(p._id), p.monthlyPrice]));

    let mrr = 0;
    for (const ws of payReadyWorkspaces) {
      if (!ws.plans || ws.plans.length === 0) continue;
      for (const planId of ws.plans) {
        const price = paidPlanIds.get(String(planId));
        if (price) mrr += price;
      }
    }

    return NextResponse.json({
      billing: { mrr, payReady: wPayReady, pending: wPending, enterpriseSubs: sEnterprise },
      workspaces: { active: wActive, total: wTotal },
      users: { active: uActive, total: uTotal },
      modules: { active: mActive },
      subscriptions: { active: sActive, plan: sPlan, enterprise: sEnterprise },
    });
  } catch (err) {
    console.error('[stats] Error:', err);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
