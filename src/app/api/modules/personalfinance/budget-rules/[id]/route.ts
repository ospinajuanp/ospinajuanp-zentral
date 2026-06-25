import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import dbConnect from '@/lib/db/mongoose';
import { getApiAuth } from '@/lib/auth/api';
import { checkFeatureEnabled } from '@/lib/settings/guard';
import { BudgetRule } from '@/lib/models/personalfinance-budget-rule';
import { consumeQuota } from '@/lib/modules/personalfinance/quota';
import type { IBudgetRule } from '@/lib/models/personalfinance-budget-rule';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getApiAuth(req);
  if (!auth || !auth.workspaceId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const check = await checkFeatureEnabled(req, 'personalFinanceEnabled');
  if (check) return check;

  const { id } = await params;

  await dbConnect();

  if (id.startsWith('default-')) {
    const defaultName = id.replace('default-', '');
    const defaultRules: Record<string, any> = {
      '50/30/20': { name: '50/30/20', percentages: { obligatory: 50, savingsInvestment: 30, discretionary: 20 }, isCustom: false },
      '70/20/10': { name: '70/20/10', percentages: { obligatory: 70, savingsInvestment: 20, discretionary: 10 }, isCustom: false },
    };

    const defaultRule = defaultRules[defaultName];
    if (!defaultRule) {
      return NextResponse.json({ error: 'Regla no encontrada' }, { status: 404 });
    }

    return NextResponse.json({
      _id: id,
      ...defaultRule,
      workspace: auth.workspaceId,
      user: auth.userId,
      isActive: false,
    });
  }

  const rule = await BudgetRule.findOne({
    _id: id,
    workspace: auth.workspaceId,
    user: auth.userId,
  }).lean();

  if (!rule) {
    return NextResponse.json({ error: 'Regla no encontrada' }, { status: 404 });
  }

  return NextResponse.json(JSON.parse(JSON.stringify(rule)) as IBudgetRule);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getApiAuth(req);
  if (!auth || !auth.workspaceId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const check = await checkFeatureEnabled(req, 'personalFinanceEnabled');
  if (check) return check;

  const { id } = await params;

  if (id.startsWith('default-')) {
    return NextResponse.json({ error: 'No se puede editar una regla predefinida' }, { status: 400 });
  }

  const body = await req.json();
  const { name, percentages, isActive } = body;

  if (percentages) {
    const { obligatory, savingsInvestment, discretionary } = percentages;
    const total = (obligatory || 0) + (savingsInvestment || 0) + (discretionary || 0);
    if (total !== 100) {
      return NextResponse.json(
        { error: `Los porcentajes deben sumar exactamente 100%. Suma actual: ${total}%` },
        { status: 400 }
      );
    }
  }

  await dbConnect();

  const existing = await BudgetRule.findOne({
    _id: id,
    workspace: auth.workspaceId,
    user: auth.userId,
  });

  if (!existing) {
    return NextResponse.json({ error: 'Regla no encontrada' }, { status: 404 });
  }

  if (isActive) {
    await BudgetRule.updateMany(
      { workspace: auth.workspaceId, user: auth.userId, _id: { $ne: id } },
      { $set: { isActive: false } }
    );
  }

  const updateFields: Partial<IBudgetRule> = {};
  if (name !== undefined) updateFields.name = name;
  if (percentages !== undefined) updateFields.percentages = percentages;
  if (isActive !== undefined) updateFields.isActive = isActive;

  const updated = await BudgetRule.findByIdAndUpdate(
    id,
    { $set: updateFields },
    { new: true, lean: true }
  );

  return NextResponse.json(JSON.parse(JSON.stringify(updated)) as IBudgetRule);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getApiAuth(req);
  if (!auth || !auth.workspaceId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const check = await checkFeatureEnabled(req, 'personalFinanceEnabled');
  if (check) return check;

  const { id } = await params;

  if (id.startsWith('default-')) {
    return NextResponse.json({ error: 'No se puede eliminar una regla predefinida' }, { status: 400 });
  }

  const { consumed } = await consumeQuota(auth.workspaceId);
  if (!consumed) {
    return NextResponse.json({ error: 'Cuota mensual excedida', remaining: 0 }, { status: 429 });
  }

  await dbConnect();

  const deleted = await BudgetRule.findOneAndDelete({
    _id: id,
    workspace: auth.workspaceId,
    user: auth.userId,
    isCustom: true,
  });

  if (!deleted) {
    return NextResponse.json({ error: 'Regla no encontrada o no es personalizable' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getApiAuth(req);
  if (!auth || !auth.workspaceId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const check = await checkFeatureEnabled(req, 'personalFinanceEnabled');
  if (check) return check;

  const { id } = await params;

  if (id.startsWith('default-')) {
    const defaultRules: Record<string, any> = {
      '50/30/20': { name: '50/30/20', percentages: { obligatory: 50, savingsInvestment: 30, discretionary: 20 }, isCustom: false },
      '70/20/10': { name: '70/20/10', percentages: { obligatory: 70, savingsInvestment: 20, discretionary: 10 }, isCustom: false },
    };

    const defaultRule = defaultRules[id.replace('default-', '')];
    if (!defaultRule) {
      return NextResponse.json({ error: 'Regla no encontrada' }, { status: 404 });
    }

    await dbConnect();

    await BudgetRule.updateMany(
      { workspace: auth.workspaceId, user: auth.userId },
      { $set: { isActive: false } }
    );

    const activated = await BudgetRule.create({
      workspace: auth.workspaceId,
      user: auth.userId,
      ...defaultRule,
      isActive: true,
    });

    return NextResponse.json(JSON.parse(JSON.stringify(activated)) as IBudgetRule);
  }

  await dbConnect();

  const existing = await BudgetRule.findOne({
    _id: id,
    workspace: auth.workspaceId,
    user: auth.userId,
  });

  if (!existing) {
    return NextResponse.json({ error: 'Regla no encontrada' }, { status: 404 });
  }

  await BudgetRule.updateMany(
    { workspace: auth.workspaceId, user: auth.userId },
    { $set: { isActive: false } }
  );

  const activated = await BudgetRule.findByIdAndUpdate(
    id,
    { $set: { isActive: true } },
    { new: true, lean: true }
  );

  return NextResponse.json(JSON.parse(JSON.stringify(activated)) as IBudgetRule);
}
