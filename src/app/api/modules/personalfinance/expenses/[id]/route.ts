import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import dbConnect from '@/lib/db/mongoose';
import { getApiAuth } from '@/lib/auth/api';
import { checkFeatureEnabled } from '@/lib/settings/guard';
import { PersonalFinanceExpense } from '@/lib/models/personalfinance-expense';
import { consumeQuota } from '@/lib/modules/personalfinance/quota';
import type { IPersonalFinanceExpense } from '@/lib/models/personalfinance-expense';

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

  const expense = await PersonalFinanceExpense.findOne({
    _id: id,
    workspace: auth.workspaceId,
    user: auth.userId,
  }).lean();

  if (!expense) {
    return NextResponse.json({ error: 'Gasto no encontrado' }, { status: 404 });
  }

  return NextResponse.json(JSON.parse(JSON.stringify(expense)) as IPersonalFinanceExpense);
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
  const { type, category, amount, currency, isRecurrent, recurringPeriod, description, date, emergencyFundTarget, monthsToEmergencyFund } = body;

  await dbConnect();

  const expense = await PersonalFinanceExpense.findOneAndUpdate(
    { _id: id, workspace: auth.workspaceId, user: auth.userId },
    {
      $set: {
        ...(type && { type }),
        ...(category && { category }),
        ...(amount !== undefined && { amount: parseFloat(amount) }),
        ...(currency && { currency }),
        ...(isRecurrent !== undefined && { isRecurrent }),
        ...(recurringPeriod && { recurringPeriod }),
        ...(description !== undefined && { description }),
        ...(date && { date: new Date(date) }),
        ...(emergencyFundTarget !== undefined && { emergencyFundTarget: parseFloat(emergencyFundTarget) }),
        ...(monthsToEmergencyFund !== undefined && { monthsToEmergencyFund: parseInt(monthsToEmergencyFund) }),
      },
    },
    { new: true, lean: true }
  );

  if (!expense) {
    return NextResponse.json({ error: 'Gasto no encontrado' }, { status: 404 });
  }

  return NextResponse.json(JSON.parse(JSON.stringify(expense)) as IPersonalFinanceExpense);
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

  const expense = await PersonalFinanceExpense.findOneAndDelete({
    _id: id,
    workspace: auth.workspaceId,
    user: auth.userId,
  });

  if (!expense) {
    return NextResponse.json({ error: 'Gasto no encontrado' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
