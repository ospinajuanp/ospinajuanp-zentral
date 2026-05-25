import { NextRequest, NextResponse } from 'next/server';
import { getApiAuth } from '@/lib/auth/api';
import dbConnect from '@/lib/db/mongoose';
import { Workspace } from '@/lib/models/workspace';
import { Plan } from '@/lib/models/plan';
import { ModuleSubscription } from '@/lib/models/module-subscription';
import { WorkspacePurchase } from '@/lib/models/workspace-purchase';

export async function POST(req: NextRequest) {
  try {
    const auth = await getApiAuth(req);
    if (!auth) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (auth.role !== 'admin') {
      return NextResponse.json({ error: 'Solo administradores pueden comprar planes' }, { status: 403 });
    }

    if (!auth.workspaceId) {
      return NextResponse.json({ error: 'Sin workspace asignado' }, { status: 403 });
    }

    const { planId } = await req.json();

    if (!planId) {
      return NextResponse.json({ error: 'planId requerido' }, { status: 400 });
    }

    await dbConnect();

    const workspace = await Workspace.findById(auth.workspaceId);
    if (!workspace) {
      return NextResponse.json({ error: 'Workspace no encontrado' }, { status: 404 });
    }

    const plan = await Plan.findById(planId);
    if (!plan) {
      return NextResponse.json({ error: 'Plan no encontrado' }, { status: 404 });
    }

    const amount = plan.monthlyPrice || 0;
    const isFree = amount === 0;

    // Simulated purchase — always completes
    const purchase = await WorkspacePurchase.create({
      workspace: workspace._id,
      plan: plan._id,
      planName: plan.name,
      amount,
      currency: 'COP',
      status: 'completed',
      paymentMethod: 'simulated',
    });

    // Update workspace
    workspace.plan = plan._id;
    workspace.isPayReady = isFree;
    await workspace.save();

    // Remove old module subscriptions
    await ModuleSubscription.deleteMany({ workspace: workspace._id });

    // Create new module subscriptions from plan
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const subscriptions = plan.includedModules.map((pm: { module: { toString: () => string }; quotaOverride: number | null }) => ({
      workspace: workspace._id,
      moduleKey: pm.module.toString(),
      tier: 'premium' as const,
      status: isFree ? 'active' as const : 'active' as const, // simulated: always active
      monthlyQuota: pm.quotaOverride || 100,
      usedQuota: 0,
      quotaResetAt: nextMonth,
    }));

    if (subscriptions.length > 0) {
      await ModuleSubscription.insertMany(subscriptions);
    }

    return NextResponse.json({
      success: true,
      purchase: {
        id: purchase._id,
        planName: purchase.planName,
        amount: purchase.amount,
        currency: purchase.currency,
        status: purchase.status,
      },
    });
  } catch (error) {
    console.error('[purchase] Error:', error);
    return NextResponse.json(
      { error: 'No se pudo procesar la compra. Reintenta en unos minutos.' },
      { status: 500 }
    );
  }
}
