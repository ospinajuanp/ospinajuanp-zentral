import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import dbConnect from '@/lib/db/mongoose';
import { getApiAuth } from '@/lib/auth/api';
import { checkFeatureEnabled } from '@/lib/settings/guard';
import { SavingsInvestment } from '@/lib/models/savings-investment';
import { recalculateFinancialPosition } from '@/lib/modules/personalfinance/financial-position';
import type { ISavingsInvestment } from '@/lib/models/savings-investment';

export async function GET(req: NextRequest) {
  const auth = await getApiAuth(req);
  if (!auth || !auth.workspaceId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const check = await checkFeatureEnabled(req, 'personalFinanceEnabled');
  if (check) return check;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') || 'active';

  await dbConnect();

  const savings = await SavingsInvestment.find({
    workspace: auth.workspaceId,
    user: auth.userId,
    ...(status !== 'all' ? { status } : {}),
  })
    .sort({ createdAt: -1 })
    .lean();

  return NextResponse.json({
    items: JSON.parse(JSON.stringify(savings)) as ISavingsInvestment[],
    total: savings.length,
  });
}

export async function POST(req: NextRequest) {
  const auth = await getApiAuth(req);
  if (!auth || !auth.workspaceId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const check = await checkFeatureEnabled(req, 'personalFinanceEnabled');
  if (check) return check;

  const body = await req.json();
  const { name, type, initialAmount, currentBalance, interestRate, interestFrequency, startDate, expectedEndDate, notes } = body;

  if (!name || !type || initialAmount === undefined || !startDate) {
    return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
  }

  await dbConnect();

  const savings = await SavingsInvestment.create({
    workspace: auth.workspaceId,
    user: auth.userId,
    name,
    type,
    initialAmount: parseFloat(initialAmount),
    currentBalance: parseFloat(currentBalance) || parseFloat(initialAmount),
    interestRate: parseFloat(interestRate) || 0,
    interestFrequency: interestFrequency || 'none',
    startDate: new Date(startDate),
    expectedEndDate: expectedEndDate ? new Date(expectedEndDate) : undefined,
    notes,
    status: 'active',
    lastInterestCalculation: new Date(),
  });

  await recalculateFinancialPosition(auth.workspaceId, auth.userId);

  return NextResponse.json(JSON.parse(JSON.stringify(savings)) as ISavingsInvestment, { status: 201 });
}
