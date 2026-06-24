import { NextRequest, NextResponse } from 'next/server';
import { getApiAuth } from '@/lib/auth/api';
import { checkFeatureEnabled } from '@/lib/settings/guard';
import dbConnect from '@/lib/db/mongoose';
import { ModuleSubscription } from '@/lib/models/module-subscription';

export async function GET(req: NextRequest) {
  try {
    const auth = await getApiAuth(req);
    if (!auth || !auth.workspaceId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const check = await checkFeatureEnabled(req, 'personalFinanceEnabled');
    if (check) return check;

    await dbConnect();

    const subs = await ModuleSubscription.find({
      workspace: auth.workspaceId,
      moduleKey: 'personalfinance',
      status: 'active',
    });

    if (!subs.length) {
      return NextResponse.json({ error: 'Sin suscripcion activa' }, { status: 404 });
    }

    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    for (const sub of subs) {
      if (sub.quotaResetAt && now >= sub.quotaResetAt) {
        sub.usedQuota = 0;
        sub.quotaResetAt = nextMonth;
        await sub.save();
      }
    }

    let used = 0;
    let total = 0;
    for (const s of subs) {
      used += s.usedQuota;
      total += s.monthlyQuota;
    }

    const unlimited = total <= 0;

    return NextResponse.json({
      used,
      total,
      remaining: unlimited ? -1 : Math.max(0, total - used),
      unlimited,
    });
  } catch (error) {
    console.error('[personalfinance-quota] Error:', error);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
