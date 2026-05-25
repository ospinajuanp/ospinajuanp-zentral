import { NextRequest, NextResponse } from 'next/server';
import { getApiAuth } from '@/lib/auth/api';
import dbConnect from '@/lib/db/mongoose';
import { ModuleSubscription } from '@/lib/models/module-subscription';

export async function GET(req: NextRequest) {
  try {
    const auth = await getApiAuth(req);
    if (!auth) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (!auth.workspaceId) {
      return NextResponse.json({ error: 'Sin workspace asignado' }, { status: 403 });
    }

    await dbConnect();

    const sub = await ModuleSubscription.findOne({
      workspace: auth.workspaceId,
      moduleKey: 'transfercheck',
      status: 'active',
    });

    if (!sub) {
      return NextResponse.json({ error: 'Sin suscripción activa' }, { status: 404 });
    }

    const now = new Date();
    if (sub.quotaResetAt && now >= sub.quotaResetAt) {
      sub.usedQuota = 0;
      sub.quotaResetAt = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      await sub.save();
    }

    const unlimited = sub.monthlyQuota <= 0;

    return NextResponse.json({
      used: sub.usedQuota,
      total: sub.monthlyQuota,
      remaining: unlimited ? -1 : Math.max(0, sub.monthlyQuota - sub.usedQuota),
      unlimited,
    });
  } catch (error) {
    console.error('[transfercheck-quota] Error:', error);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
