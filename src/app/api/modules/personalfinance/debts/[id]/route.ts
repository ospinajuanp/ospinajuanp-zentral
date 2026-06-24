import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import dbConnect from '@/lib/db/mongoose';
import { getApiAuth } from '@/lib/auth/api';
import { checkFeatureEnabled } from '@/lib/settings/guard';
import { PersonalFinanceDebt } from '@/lib/models/personalfinance-debt';
import { consumeQuota } from '@/lib/modules/personalfinance/quota';
import type { IPersonalFinanceDebt } from '@/lib/models/personalfinance-debt';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getApiAuth(req);
  if (!auth || !auth.workspaceId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const check = await checkFeatureEnabled(req, 'personalFinanceEnabled');
  if (check) return check;

  const { consumed } = await consumeQuota(auth.workspaceId);
  if (!consumed) {
    return NextResponse.json({ error: 'Cuota mensual excedida', remaining: 0 }, { status: 429 });
  }

  const { id } = await params;

  const body = await req.json();
  const {
    debtType,
    creditor,
    originalAmount,
    currentBalance,
    currency,
    interestRate,
    monthlyPayment,
    startDate,
    expectedEndDate,
    status,
    notes,
  } = body;

  await dbConnect();

  const debt = await PersonalFinanceDebt.findOneAndUpdate(
    { _id: id, workspace: auth.workspaceId, user: auth.userId },
    {
      $set: {
        ...(debtType && { debtType }),
        ...(creditor && { creditor }),
        ...(originalAmount !== undefined && { originalAmount: parseFloat(originalAmount) }),
        ...(currentBalance !== undefined && { currentBalance: parseFloat(currentBalance) }),
        ...(currency && { currency }),
        ...(interestRate !== undefined && { interestRate: parseFloat(interestRate) }),
        ...(monthlyPayment !== undefined && { monthlyPayment: parseFloat(monthlyPayment) }),
        ...(startDate && { startDate: new Date(startDate) }),
        ...(expectedEndDate !== undefined && { expectedEndDate: expectedEndDate ? new Date(expectedEndDate) : null }),
        ...(status && { status }),
        ...(notes !== undefined && { notes }),
      },
    },
    { new: true, lean: true }
  );

  if (!debt) {
    return NextResponse.json({ error: 'Deuda no encontrada' }, { status: 404 });
  }

  return NextResponse.json(JSON.parse(JSON.stringify(debt)) as IPersonalFinanceDebt);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getApiAuth(req);
  if (!auth || !auth.workspaceId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const check = await checkFeatureEnabled(req, 'personalFinanceEnabled');
  if (check) return check;

  const { consumed } = await consumeQuota(auth.workspaceId);
  if (!consumed) {
    return NextResponse.json({ error: 'Cuota mensual excedida', remaining: 0 }, { status: 429 });
  }

  const { id } = await params;

  await dbConnect();

  const debt = await PersonalFinanceDebt.findOneAndDelete({
    _id: id,
    workspace: auth.workspaceId,
    user: auth.userId,
  });

  if (!debt) {
    return NextResponse.json({ error: 'Deuda no encontrada' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
