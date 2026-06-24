import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import dbConnect from '@/lib/db/mongoose';
import { getApiAuth } from '@/lib/auth/api';
import { checkFeatureEnabled } from '@/lib/settings/guard';
import { PersonalFinanceSummary } from '@/lib/models/personalfinance-summary';
import type { IPersonalFinanceSummary } from '@/lib/models/personalfinance-summary';

export async function GET(req: NextRequest) {
  const auth = await getApiAuth(req);
  if (!auth || !auth.workspaceId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const check = await checkFeatureEnabled(req, 'personalFinanceEnabled');
  if (check) return check;

  await dbConnect();

  let summary = await PersonalFinanceSummary.findOne({
    workspace: auth.workspaceId,
    user: auth.userId,
  }).lean();

  if (!summary) {
    summary = await PersonalFinanceSummary.create({
      workspace: auth.workspaceId,
      user: auth.userId,
      currency: 'COP',
      billingCycleDay: 1,
    });
  }

  const result = JSON.parse(JSON.stringify(summary)) as IPersonalFinanceSummary;

  return NextResponse.json(result);
}

export async function PUT(req: NextRequest) {
  const auth = await getApiAuth(req);
  if (!auth || !auth.workspaceId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const check = await checkFeatureEnabled(req, 'personalFinanceEnabled');
  if (check) return check;

  const body = await req.json();
  const { currency, billingCycleDay } = body;

  await dbConnect();

  const summary = await PersonalFinanceSummary.findOneAndUpdate(
    { workspace: auth.workspaceId, user: auth.userId },
    {
      $set: {
        ...(currency && { currency }),
        ...(billingCycleDay !== undefined && { billingCycleDay }),
      },
    },
    { new: true, lean: true }
  );

  if (!summary) {
    return NextResponse.json({ error: 'Resumen no encontrado' }, { status: 404 });
  }

  const result = JSON.parse(JSON.stringify(summary)) as IPersonalFinanceSummary;

  return NextResponse.json(result);
}
