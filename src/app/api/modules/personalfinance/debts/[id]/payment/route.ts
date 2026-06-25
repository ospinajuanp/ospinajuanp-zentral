import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import dbConnect from '@/lib/db/mongoose';
import { getApiAuth } from '@/lib/auth/api';
import { checkFeatureEnabled } from '@/lib/settings/guard';
import { PersonalFinanceDebt } from '@/lib/models/personalfinance-debt';
import { DebtPayment } from '@/lib/models/debt-payment';
import { consumeQuota } from '@/lib/modules/personalfinance/quota';
import type { IPersonalFinanceDebt } from '@/lib/models/personalfinance-debt';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
  const { amount } = body;

  if (!amount || parseFloat(amount) <= 0) {
    return NextResponse.json({ error: 'Monto debe ser mayor a 0' }, { status: 400 });
  }

  await dbConnect();

  const debt = await PersonalFinanceDebt.findOne({
    _id: id,
    workspace: auth.workspaceId,
    user: auth.userId,
  });

  if (!debt) {
    return NextResponse.json({ error: 'Deuda no encontrada' }, { status: 404 });
  }

  if (debt.status === 'paid') {
    return NextResponse.json({ error: 'Esta deuda ya esta pagada' }, { status: 400 });
  }

  const paymentAmount = parseFloat(amount);
  const newBalance = Math.max(0, debt.currentBalance - paymentAmount);

  const interestPortion = debt.currentBalance * (debt.interestRate / 100);
  const principalPortion = Math.min(paymentAmount, debt.currentBalance) - interestPortion;

  await DebtPayment.create({
    workspace: auth.workspaceId,
    user: auth.userId,
    debtId: debt._id,
    amount: paymentAmount,
    principalPortion: Math.max(0, principalPortion),
    interestPortion: Math.max(0, interestPortion),
    balanceAfter: newBalance,
    paymentDate: new Date(),
  });

  const updatedDebt = await PersonalFinanceDebt.findByIdAndUpdate(
    id,
    {
      $set: {
        currentBalance: newBalance,
        status: newBalance === 0 ? 'paid' : 'active',
      },
    },
    { new: true, lean: true }
  );

  return NextResponse.json(JSON.parse(JSON.stringify(updatedDebt)) as IPersonalFinanceDebt);
}
