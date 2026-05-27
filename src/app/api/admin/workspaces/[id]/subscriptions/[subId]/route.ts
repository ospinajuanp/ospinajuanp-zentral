import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongoose';
import { ModuleSubscription } from '@/lib/models/module-subscription';
import { WorkspacePurchase } from '@/lib/models/workspace-purchase';
import { getApiAuth } from '@/lib/auth/api';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string; subId: string }> }) {
  try {
    const auth = await getApiAuth(req);
    if (!auth || auth.role !== 'superadmin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { id, subId } = await params;
    const body = await req.json();
    const { tier, status, monthlyQuota, autoRenew } = body;

    await dbConnect();

    const update: Record<string, unknown> = {};
    if (tier !== undefined) update.tier = tier;
    if (status !== undefined) update.status = status;
    if (monthlyQuota !== undefined) update.monthlyQuota = monthlyQuota;
    if (autoRenew !== undefined) update.autoRenew = autoRenew;

    const sub = await ModuleSubscription.findOneAndUpdate(
      { _id: subId, workspace: id },
      { $set: update },
      { new: true, runValidators: true }
    );

    if (!sub) {
      return NextResponse.json({ error: 'Suscripcion no encontrada' }, { status: 404 });
    }

    return NextResponse.json({ subscription: sub });
  } catch {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string; subId: string }> }) {
  try {
    const auth = await getApiAuth(req);
    if (!auth || auth.role !== 'superadmin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { id, subId } = await params;
    await dbConnect();

    const sub = await ModuleSubscription.findById(subId);
    if (!sub) {
      return NextResponse.json({ error: 'Suscripcion no encontrada' }, { status: 404 });
    }

    const moduleKey = sub.moduleKey;

    await ModuleSubscription.findByIdAndDelete(subId);

    await WorkspacePurchase.deleteMany({
      workspace: id,
      'modules.moduleKey': moduleKey,
      paymentMethod: 'manual',
      status: 'active',
    });

    return NextResponse.json({ message: 'Suscripcion eliminada' });
  } catch (err) {
    console.error('[subscriptions] DELETE error:', err);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
