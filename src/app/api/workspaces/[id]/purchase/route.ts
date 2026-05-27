import { NextRequest, NextResponse } from 'next/server';
import { getApiAuth } from '@/lib/auth/api';
import { checkFeatureEnabled } from '@/lib/settings/guard';
import dbConnect from '@/lib/db/mongoose';
import { Workspace } from '@/lib/models/workspace';
import { Plan } from '@/lib/models/plan';
import { WorkspacePurchase } from '@/lib/models/workspace-purchase';
import { recalculateQuotas } from '@/lib/purchase/recalculate-quotas';

export async function POST(req: NextRequest) {
  try {
    const auth = await getApiAuth(req);
    if (!auth) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const check = await checkFeatureEnabled(req, 'simulatedPurchaseEnabled');
    if (check) return check;

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

    // Migrate old workspaces from plan (singular) to plans (array)
    if (!workspace.plans || !Array.isArray(workspace.plans)) {
      workspace.plans = [];
    }

    const plan = await Plan.findById(planId)
      .populate('includedModules.module', 'key defaultQuota tier')
      .lean();
    if (!plan) {
      return NextResponse.json({ error: 'Plan no encontrado' }, { status: 404 });
    }

    const amount = plan.monthlyPrice || 0;
    const isFree = amount === 0;

    // Free plans: solo 1 por workspace
    const planIdStr = plan._id.toString();
    if (isFree && workspace.plans.some((p: { toString: () => string }) => p.toString() === planIdStr)) {
      return NextResponse.json(
        { error: 'Ya tenés el plan gratuito contratado. Solo se permite uno por workspace.' },
        { status: 400 }
      );
    }

    const modules = plan.includedModules.map((pm: { module: { key: string; tier: string; defaultQuota: number }; quotaOverride: number | null }) => ({
      moduleKey: pm.module.key,
      quota: pm.quotaOverride ?? pm.module.defaultQuota ?? 100,
      tier: pm.module.tier ?? 'free',
    }));

    const purchase = await WorkspacePurchase.create({
      workspace: workspace._id,
      plan: plan._id,
      planName: plan.name,
      amount,
      currency: 'COP',
      status: 'active',
      paymentMethod: 'simulated',
      modules,
    });

    if (!workspace.plans.some((p: { toString: () => string }) => p.toString() === planIdStr)) {
      workspace.plans.push(plan._id);
    }

    workspace.isPayReady = true;
    await workspace.save();

    await recalculateQuotas(workspace._id.toString());

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
