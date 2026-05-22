import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongoose';
import { ModuleSubscription } from '@/lib/models/module-subscription';
import { getApiAuth } from '@/lib/auth/api';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string; subId: string }> }) {
  try {
    const auth = await getApiAuth(req);
    if (!auth || auth.role !== 'superadmin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { subId } = await params;
    const body = await req.json();
    const { tier, status, monthlyQuota } = body;

    await dbConnect();

    const update: Record<string, unknown> = {};
    if (tier !== undefined) update.tier = tier;
    if (status !== undefined) update.status = status;
    if (monthlyQuota !== undefined) update.monthlyQuota = monthlyQuota;

    const sub = await ModuleSubscription.findByIdAndUpdate(
      subId,
      { $set: update },
      { new: true, runValidators: true }
    );

    if (!sub) {
      return NextResponse.json({ error: 'Suscripción no encontrada' }, { status: 404 });
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

    const { subId } = await params;
    await dbConnect();

    const sub = await ModuleSubscription.findByIdAndDelete(subId);

    if (!sub) {
      return NextResponse.json({ error: 'Suscripción no encontrada' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Suscripción eliminada' });
  } catch {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
