import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import dbConnect from '@/lib/db/mongoose';
import { getApiAuth } from '@/lib/auth/api';
import { checkFeatureEnabled } from '@/lib/settings/guard';
import { EmergencyFund } from '@/lib/models/emergency-fund';
import { PersonalFinanceExpense } from '@/lib/models/personalfinance-expense';
import { consumeQuota } from '@/lib/modules/personalfinance/quota';
import { recalculateFinancialPosition } from '@/lib/modules/personalfinance/financial-position';
import type { IEmergencyFund } from '@/lib/models/emergency-fund';

export async function GET(req: NextRequest) {
  const auth = await getApiAuth(req);
  if (!auth || !auth.workspaceId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const check = await checkFeatureEnabled(req, 'personalFinanceEnabled');
  if (check) return check;

  await dbConnect();

  const emergencyFund = await EmergencyFund.findOne({
    workspace: auth.workspaceId,
    user: auth.userId,
  }).lean();

  if (!emergencyFund) {
    return NextResponse.json({ savedAmount: 0, monthsCompleted: 0, lastUpdated: null });
  }

  return NextResponse.json(JSON.parse(JSON.stringify(emergencyFund)) as IEmergencyFund);
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
  const { linkedExpenseId } = body;

  if (!linkedExpenseId) {
    return NextResponse.json({ error: 'Falta linkedExpenseId' }, { status: 400 });
  }

  await dbConnect();

  const expense = await PersonalFinanceExpense.findOne({
    _id: linkedExpenseId,
    workspace: auth.workspaceId,
    user: auth.userId,
    category: 'Fondo de Emergencia',
  });

  if (!expense) {
    return NextResponse.json({ error: 'Egreso de ahorro emergencia no encontrado' }, { status: 404 });
  }

  const existingFund = await EmergencyFund.findOne({
    workspace: auth.workspaceId,
    user: auth.userId,
  });

  if (existingFund) {
    return NextResponse.json({ error: 'Ya existe un fondo de emergencia' }, { status: 409 });
  }

  const emergencyFund = await EmergencyFund.create({
    workspace: auth.workspaceId,
    user: auth.userId,
    linkedExpenseId: expense._id,
    savedAmount: expense.amount,
    monthsCompleted: 1,
    lastUpdated: new Date(),
  });

  await recalculateFinancialPosition(auth.workspaceId, auth.userId);

  return NextResponse.json(JSON.parse(JSON.stringify(emergencyFund)) as IEmergencyFund, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const auth = await getApiAuth(req);
  if (!auth || !auth.workspaceId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const check = await checkFeatureEnabled(req, 'personalFinanceEnabled');
  if (check) return check;

  const body = await req.json();
  const { savedAmount, monthsCompleted } = body;

  if (savedAmount === undefined && monthsCompleted === undefined) {
    return NextResponse.json({ error: 'Falta savedAmount o monthsCompleted' }, { status: 400 });
  }

  await dbConnect();

  const updateFields: Partial<IEmergencyFund> = {
    lastUpdated: new Date(),
  };

  if (savedAmount !== undefined) {
    updateFields.savedAmount = parseFloat(savedAmount);
  }

  if (monthsCompleted !== undefined) {
    updateFields.monthsCompleted = parseInt(monthsCompleted);
  }

  const emergencyFund = await EmergencyFund.findOneAndUpdate(
    {
      workspace: auth.workspaceId,
      user: auth.userId,
    },
    { $set: updateFields },
    { new: true }
  ).lean();

  if (!emergencyFund) {
    return NextResponse.json({ error: 'Fondo de emergencia no encontrado' }, { status: 404 });
  }

  await recalculateFinancialPosition(auth.workspaceId, auth.userId);

  return NextResponse.json(JSON.parse(JSON.stringify(emergencyFund)) as IEmergencyFund);
}
