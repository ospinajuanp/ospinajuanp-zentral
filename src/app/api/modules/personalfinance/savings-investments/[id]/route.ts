import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import dbConnect from '@/lib/db/mongoose';
import { getApiAuth } from '@/lib/auth/api';
import { checkFeatureEnabled } from '@/lib/settings/guard';
import { SavingsInvestment } from '@/lib/models/savings-investment';
import { recalculateFinancialPosition } from '@/lib/modules/personalfinance/financial-position';
import type { ISavingsInvestment } from '@/lib/models/savings-investment';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getApiAuth(req);
  if (!auth || !auth.workspaceId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const check = await checkFeatureEnabled(req, 'personalFinanceEnabled');
  if (check) return check;

  const { id } = await params;

  await dbConnect();

  const savings = await SavingsInvestment.findOne({
    _id: id,
    workspace: auth.workspaceId,
    user: auth.userId,
  }).lean();

  if (!savings) {
    return NextResponse.json({ error: 'Ahorro/inversión no encontrada' }, { status: 404 });
  }

  return NextResponse.json(JSON.parse(JSON.stringify(savings)) as ISavingsInvestment);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getApiAuth(req);
  if (!auth || !auth.workspaceId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const check = await checkFeatureEnabled(req, 'personalFinanceEnabled');
  if (check) return check;

  const { id } = await params;
  const body = await req.json();

  await dbConnect();

  const existing = await SavingsInvestment.findOne({
    _id: id,
    workspace: auth.workspaceId,
    user: auth.userId,
  });

  if (!existing) {
    return NextResponse.json({ error: 'Ahorro/inversión no encontrada' }, { status: 404 });
  }

  const updateFields: Partial<ISavingsInvestment> = {};

  if (body.name !== undefined) updateFields.name = body.name;
  if (body.type !== undefined) updateFields.type = body.type;
  if (body.currentBalance !== undefined) updateFields.currentBalance = parseFloat(body.currentBalance);
  if (body.interestRate !== undefined) updateFields.interestRate = parseFloat(body.interestRate);
  if (body.interestFrequency !== undefined) updateFields.interestFrequency = body.interestFrequency;
  if (body.expectedEndDate !== undefined) updateFields.expectedEndDate = body.expectedEndDate ? new Date(body.expectedEndDate) : undefined;
  if (body.notes !== undefined) updateFields.notes = body.notes;
  if (body.status !== undefined) updateFields.status = body.status;

  const updated = await SavingsInvestment.findByIdAndUpdate(id, { $set: updateFields }, { new: true, lean: true });

  await recalculateFinancialPosition(auth.workspaceId, auth.userId);

  return NextResponse.json(JSON.parse(JSON.stringify(updated)) as ISavingsInvestment);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getApiAuth(req);
  if (!auth || !auth.workspaceId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const check = await checkFeatureEnabled(req, 'personalFinanceEnabled');
  if (check) return check;

  const { id } = await params;

  await dbConnect();

  const deleted = await SavingsInvestment.findOneAndDelete({
    _id: id,
    workspace: auth.workspaceId,
    user: auth.userId,
  });

  if (!deleted) {
    return NextResponse.json({ error: 'Ahorro/inversión no encontrada' }, { status: 404 });
  }

  await recalculateFinancialPosition(auth.workspaceId, auth.userId);

  return NextResponse.json({ success: true });
}
