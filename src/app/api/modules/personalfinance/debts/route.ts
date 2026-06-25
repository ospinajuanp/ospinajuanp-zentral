import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import dbConnect from '@/lib/db/mongoose';
import { getApiAuth } from '@/lib/auth/api';
import { checkFeatureEnabled } from '@/lib/settings/guard';
import { PersonalFinanceDebt } from '@/lib/models/personalfinance-debt';
import { PersonalFinanceExpense } from '@/lib/models/personalfinance-expense';
import { PersonalFinanceSummary } from '@/lib/models/personalfinance-summary';
import { consumeQuota } from '@/lib/modules/personalfinance/quota';
import type { IPersonalFinanceDebt, DebtStatus } from '@/lib/models/personalfinance-debt';

export async function GET(req: NextRequest) {
  const auth = await getApiAuth(req);
  if (!auth || !auth.workspaceId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const check = await checkFeatureEnabled(req, 'personalFinanceEnabled');
  if (check) return check;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') as DebtStatus | null;
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const limit = Math.min(100, Math.max(5, parseInt(searchParams.get('limit') || '50')));

  await dbConnect();

  const filter: Record<string, unknown> = {
    workspace: auth.workspaceId,
    user: auth.userId,
  };

  if (status) filter.status = status;

  const [items, total] = await Promise.all([
    PersonalFinanceDebt.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    PersonalFinanceDebt.countDocuments(filter),
  ]);

  const totals = await PersonalFinanceDebt.aggregate([
    { $match: { workspace: auth.workspaceId as unknown as import('mongoose').Types.ObjectId, user: auth.userId as unknown as import('mongoose').Types.ObjectId, status: 'active' } },
    { $group: { _id: null, totalBalance: { $sum: '$currentBalance' }, totalMonthlyPayment: { $sum: '$monthlyPayment' } } },
  ]);

  return NextResponse.json({
    items: JSON.parse(JSON.stringify(items)) as IPersonalFinanceDebt[],
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    summary: totals[0] || { totalBalance: 0, totalMonthlyPayment: 0 },
  });
}

export async function POST(req: NextRequest) {
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
    notes,
  } = body;

  if (!debtType || !creditor || originalAmount === undefined || currentBalance === undefined || !currency || interestRate === undefined || monthlyPayment === undefined || !startDate) {
    return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
  }

  await dbConnect();

  const debt = await PersonalFinanceDebt.create({
    workspace: auth.workspaceId,
    user: auth.userId,
    debtType,
    creditor,
    originalAmount: parseFloat(originalAmount),
    currentBalance: parseFloat(currentBalance),
    currency,
    interestRate: parseFloat(interestRate),
    monthlyPayment: parseFloat(monthlyPayment),
    startDate: new Date(startDate),
    expectedEndDate: expectedEndDate ? new Date(expectedEndDate) : undefined,
    notes,
    status: 'active',
  });

  const summary = await PersonalFinanceSummary.findOne({
    workspace: auth.workspaceId,
    user: auth.userId,
  }).lean();

  const cycleDay = (summary as { billingCycleDay?: number })?.billingCycleDay || 1;
  const now = new Date();
  const expenseDate = new Date(now.getFullYear(), now.getMonth(), cycleDay);

  await PersonalFinanceExpense.create({
    workspace: auth.workspaceId,
    user: auth.userId,
    type: 'obligatory',
    category: 'Pago de deudas',
    amount: parseFloat(monthlyPayment),
    currency,
    isRecurrent: true,
    recurringPeriod: 'monthly',
    description: `Cuota ${creditor}`,
    date: expenseDate,
  });

  return NextResponse.json(JSON.parse(JSON.stringify(debt)) as IPersonalFinanceDebt, { status: 201 });
}
