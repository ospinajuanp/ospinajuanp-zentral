import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongoose';
import { ModuleSubscription } from '@/lib/models/module-subscription';
import { Module } from '@/lib/models/module';
import { WorkspacePurchase } from '@/lib/models/workspace-purchase';
import { getApiAuth } from '@/lib/auth/api';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await getApiAuth(req);
    if (!auth || auth.role !== 'superadmin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

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

    const { id } = await params;
    const body = await req.json();
    const { moduleKey, tier, status, monthlyQuota, autoRenew } = body;

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
    const finalTier = tier ?? mod.tier;

    const sub = await ModuleSubscription.findOneAndUpdate(
      { workspace: id, moduleKey: normalizedKey },
      {
        $set: {
          tier: finalTier,
          status: status ?? 'active',
          monthlyQuota: quota,
          ...(autoRenew !== undefined ? { autoRenew } : {}),
        },
        $setOnInsert: {
          usedQuota: 0,
        },
      },
      { upsert: true, new: true, runValidators: true }
    );

    if (finalTier === 'enterprise') {
      const existing = await WorkspacePurchase.findOne({
        workspace: id,
        'modules.moduleKey': normalizedKey,
        paymentMethod: 'manual',
      });

      if (existing) {
        await WorkspacePurchase.updateOne(
          { _id: existing._id },
          {
            $set: {
              planName: `Enterprise (${mod.name})`,
              amount: 0,
              status: 'active',
              'modules.$[mod].quota': quota,
              'modules.$[mod].tier': 'enterprise',
            },
          },
          { arrayFilters: [{ 'mod.moduleKey': normalizedKey }] }
        );
      } else {
        await WorkspacePurchase.create({
          workspace: id,
          plan: null,
          planName: `Enterprise (${mod.name})`,
          amount: 0,
          currency: 'COP',
          status: 'active',
          paymentMethod: 'manual',
          modules: [{ moduleKey: normalizedKey, quota, tier: 'enterprise' }],
        });
      }
    }

    return NextResponse.json({ subscription: sub }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
