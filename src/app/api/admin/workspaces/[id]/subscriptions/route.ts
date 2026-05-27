import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongoose';
import { ModuleSubscription } from '@/lib/models/module-subscription';
import { Module } from '@/lib/models/module';
import { WorkspacePurchase } from '@/lib/models/workspace-purchase';
import { getApiAuth } from '@/lib/auth/api';
import { checkFeatureEnabled } from '@/lib/settings/guard';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await getApiAuth(req);
    if (!auth || auth.role !== 'superadmin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const check = await checkFeatureEnabled(req, 'workspacesEnabled');
    if (check) return check;

    const { id } = await params;
    await dbConnect();

    const subscriptions = await ModuleSubscription.find({ workspace: id }).lean();

    return NextResponse.json({ subscriptions });
  } catch {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await getApiAuth(req);
    if (!auth || auth.role !== 'superadmin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const check = await checkFeatureEnabled(req, 'workspacesEnabled');
    if (check) return check;

    const { id } = await params;
    const body = await req.json();
    const { moduleKey, monthlyQuota, autoRenew } = body;

    if (!moduleKey) {
      return NextResponse.json({ error: 'moduleKey es requerido' }, { status: 400 });
    }

    await dbConnect();

    const mod = await Module.findOne({ key: moduleKey.toLowerCase() });
    if (!mod) {
      return NextResponse.json({ error: 'Modulo no encontrado en el catalogo' }, { status: 404 });
    }

    const normalizedKey = moduleKey.toLowerCase();
    const quota = monthlyQuota ?? mod.defaultQuota;

    const sub = await ModuleSubscription.create({
      workspace: id,
      moduleKey: normalizedKey,
      tier: 'enterprise',
      status: 'active',
      monthlyQuota: quota,
      usedQuota: 0,
      autoRenew: autoRenew ?? false,
    });

    await WorkspacePurchase.create({
      workspace: id,
      plan: null,
      planName: `Enterprise (${mod.name})`,
      amount: 0,
      currency: 'COP',
      status: 'active',
      paymentMethod: 'manual',
      modules: [{ moduleKey: normalizedKey, quota, tier: 'enterprise', autoRenew: autoRenew ?? false }],
      purchasedAt: new Date(),
    });

    return NextResponse.json({ subscription: sub }, { status: 201 });
  } catch (err) {
    console.error('[subscriptions] POST error:', err);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
