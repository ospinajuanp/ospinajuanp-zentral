import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import dbConnect from '@/lib/db/mongoose';
import { getApiAuth } from '@/lib/auth/api';
import { checkFeatureEnabled } from '@/lib/settings/guard';
import { PersonalFinanceExpense } from '@/lib/models/personalfinance-expense';
import { PersonalFinanceSummary } from '@/lib/models/personalfinance-summary';
import { consumeQuota } from '@/lib/modules/personalfinance/quota';
import type { IPersonalFinanceExpense } from '@/lib/models/personalfinance-expense';

export async function GET(req: NextRequest) {
  const auth = await getApiAuth(req);
  if (!auth || !auth.workspaceId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const check = await checkFeatureEnabled(req, 'personalFinanceEnabled');
  if (check) return check;

  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type');
  const year = searchParams.get('year');
  const month = searchParams.get('month');
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const limit = Math.min(100, Math.max(5, parseInt(searchParams.get('limit') || '50')));

  await dbConnect();

  const filter: Record<string, unknown> = {
    workspace: auth.workspaceId,
    user: auth.userId,
  };

  if (type) filter.type = type;

  if (year && month) {
    const summary = await PersonalFinanceSummary.findOne({
      workspace: auth.workspaceId,
      user: auth.userId,
    }).lean();

    const cycleDay = (summary as { billingCycleDay?: number })?.billingCycleDay || 1;
    const startDate = new Date(parseInt(year), parseInt(month) - 1, cycleDay);
    const endDate = new Date(parseInt(year), parseInt(month), cycleDay);
    filter.date = { $gte: startDate, $lt: endDate };
  }

  const [items, total] = await Promise.all([
    PersonalFinanceExpense.find(filter)
      .sort({ date: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    PersonalFinanceExpense.countDocuments(filter),
  ]);

  return NextResponse.json({
    items: JSON.parse(JSON.stringify(items)) as IPersonalFinanceExpense[],
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
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
    return NextResponse.json(
      { error: 'Cuota mensual excedida', remaining: 0 },
      { status: 429 }
    );
  }

  const body = await req.json();
  const {
    type,
    category,
    amount,
    currency,
    isRecurrent,
    recurringPeriod,
    description,
    date,
    emergencyFundTarget,
    monthsToEmergencyFund,
  } = body;

  if (!type || !category || amount === undefined || !date) {
    return NextResponse.json(
      { error: 'Faltan campos requeridos: type, category, amount, date' },
      { status: 400 }
    );
  }

  await dbConnect();

  const expense = await PersonalFinanceExpense.create({
    workspace: auth.workspaceId,
    user: auth.userId,
    type,
    category,
    amount: parseFloat(amount),
    currency: currency || 'COP',
    isRecurrent: isRecurrent || false,
    recurringPeriod,
    description,
    date: new Date(date),
    emergencyFundTarget: emergencyFundTarget ? parseFloat(emergencyFundTarget) : undefined,
    monthsToEmergencyFund: monthsToEmergencyFund ? parseInt(monthsToEmergencyFund) : undefined,
  });

  return NextResponse.json(JSON.parse(JSON.stringify(expense)) as IPersonalFinanceExpense, { status: 201 });
}
