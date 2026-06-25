import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import dbConnect from '@/lib/db/mongoose';
import { getApiAuth } from '@/lib/auth/api';
import { checkFeatureEnabled } from '@/lib/settings/guard';
import { PersonalFinanceIncome } from '@/lib/models/personalfinance-income';
import { consumeQuota } from '@/lib/modules/personalfinance/quota';
import { recalculateFinancialPosition } from '@/lib/modules/personalfinance/financial-position';
import type { IPersonalFinanceIncome } from '@/lib/models/personalfinance-income';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getApiAuth(req);
  if (!auth || !auth.workspaceId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const check = await checkFeatureEnabled(req, 'personalFinanceEnabled');
  if (check) return check;

  const { id } = await params;

  await dbConnect();

  const income = await PersonalFinanceIncome.findOne({
    _id: id,
    workspace: auth.workspaceId,
    user: auth.userId,
  }).lean();

  if (!income) {
    return NextResponse.json({ error: 'Ingreso no encontrado' }, { status: 404 });
  }

  return NextResponse.json(JSON.parse(JSON.stringify(income)) as IPersonalFinanceIncome);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getApiAuth(req);
  if (!auth || !auth.workspaceId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const check = await checkFeatureEnabled(req, 'personalFinanceEnabled');
  if (check) return check;

  const { consumed } = await consumeQuota(auth.workspaceId);
  if (!consumed) {
    return NextResponse.json({ error: 'Cuota mensual excedida' }, { status: 429 });
  }

  const { id } = await params;
  const body = await req.json();
  const { type, category, amount, currency, description, date } = body;

  await dbConnect();

  const income = await PersonalFinanceIncome.findOneAndUpdate(
    { _id: id, workspace: auth.workspaceId, user: auth.userId },
    {
      $set: {
        ...(type && { type }),
        ...(category && { category }),
        ...(amount !== undefined && { amount: parseFloat(amount) }),
        ...(currency && { currency }),
        ...(description !== undefined && { description }),
        ...(date && { date: new Date(date) }),
      },
    },
    { new: true, lean: true }
  );

  if (!income) {
    return NextResponse.json({ error: 'Ingreso no encontrado' }, { status: 404 });
  }

  await recalculateFinancialPosition(auth.workspaceId, auth.userId);

  return NextResponse.json(JSON.parse(JSON.stringify(income)) as IPersonalFinanceIncome);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getApiAuth(req);
  if (!auth || !auth.workspaceId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const check = await checkFeatureEnabled(req, 'personalFinanceEnabled');
  if (check) return check;

  const { consumed } = await consumeQuota(auth.workspaceId);
  if (!consumed) {
    return NextResponse.json({ error: 'Cuota mensual excedida' }, { status: 429 });
  }

  const { id } = await params;

  await dbConnect();

  const income = await PersonalFinanceIncome.findOneAndDelete({
    _id: id,
    workspace: auth.workspaceId,
    user: auth.userId,
  });

  if (!income) {
    return NextResponse.json({ error: 'Ingreso no encontrado' }, { status: 404 });
  }

  await recalculateFinancialPosition(auth.workspaceId, auth.userId);

  return NextResponse.json({ success: true });
}
