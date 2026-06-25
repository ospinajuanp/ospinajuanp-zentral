import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import dbConnect from '@/lib/db/mongoose';
import { getApiAuth } from '@/lib/auth/api';
import { checkFeatureEnabled } from '@/lib/settings/guard';
import { BudgetRule } from '@/lib/models/personalfinance-budget-rule';
import { consumeQuota } from '@/lib/modules/personalfinance/quota';
import type { IBudgetCategory } from '@/lib/models/personalfinance-budget-rule';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getApiAuth(req);
  if (!auth || !auth.workspaceId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const check = await checkFeatureEnabled(req, 'personalFinanceEnabled');
  if (check) return check;

  const { id } = await params;

  const DEFAULT_RULES: Record<string, any> = {
    '50/30/20': {
      name: '50/30/20',
      percentages: [
        { name: 'Obligatorios', percentage: 50, expenseType: 'obligatory' },
        { name: 'Ahorro/Inversión', percentage: 30, expenseType: 'savings_investment' },
        { name: 'Discrecional', percentage: 20, expenseType: 'discretionary' },
      ],
      isCustom: false,
    },
    '70/20/10': {
      name: '70/20/10',
      percentages: [
        { name: 'Obligatorios', percentage: 70, expenseType: 'obligatory' },
        { name: 'Ahorro/Inversión', percentage: 20, expenseType: 'savings_investment' },
        { name: 'Discrecional', percentage: 10, expenseType: 'discretionary' },
      ],
      isCustom: false,
    },
    '40/30/30': {
      name: '40/30/30',
      percentages: [
        { name: 'Obligatorios', percentage: 40, expenseType: 'obligatory' },
        { name: 'Ahorro/Inversión', percentage: 30, expenseType: 'savings_investment' },
        { name: 'Discrecional', percentage: 30, expenseType: 'discretionary' },
      ],
      isCustom: false,
    },
  };

  if (id.startsWith('default-')) {
    const defaultRule = DEFAULT_RULES[id.replace('default-', '')];
    if (!defaultRule) {
      return NextResponse.json({ error: 'Regla no encontrada' }, { status: 404 });
    }

    return NextResponse.json({
      _id: id,
      ...defaultRule,
      workspace: auth.workspaceId,
      user: auth.userId,
      isActive: false,
      totalPercentage: defaultRule.percentages.reduce((s: number, p: any) => s + p.percentage, 0),
    });
  }

  await dbConnect();

  const rule = await BudgetRule.findOne({
    _id: id,
    workspace: auth.workspaceId,
    user: auth.userId,
  }).lean();

  if (!rule) {
    return NextResponse.json({ error: 'Regla no encontrada' }, { status: 404 });
  }

  return NextResponse.json({
    ...(rule as any),
    _id: rule._id.toString(),
  });
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
    if (!Array.isArray(percentages) || percentages.length === 0) {
      return NextResponse.json({ error: 'Debe haber al menos una categoría' }, { status: 400 });
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

  const updateFields: any = {};
  if (name !== undefined) updateFields.name = name;
  if (percentages !== undefined) {
    updateFields.percentages = percentages;
    updateFields.totalPercentage = (percentages as IBudgetCategory[]).reduce((sum, p) => sum + (p.percentage || 0), 0);
  }
  if (isActive !== undefined) updateFields.isActive = isActive;

  const updated = await BudgetRule.findByIdAndUpdate(
    id,
    { $set: updateFields },
    { new: true, lean: true }
  );

  return NextResponse.json(JSON.parse(JSON.stringify(updated)) as any);
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

  const DEFAULT_RULES: Record<string, any> = {
    '50/30/20': {
      name: '50/30/20',
      percentages: [
        { name: 'Obligatorios', percentage: 50, expenseType: 'obligatory' },
        { name: 'Ahorro/Inversión', percentage: 30, expenseType: 'savings_investment' },
        { name: 'Discrecional', percentage: 20, expenseType: 'discretionary' },
      ],
      isCustom: false,
    },
    '70/20/10': {
      name: '70/20/10',
      percentages: [
        { name: 'Obligatorios', percentage: 70, expenseType: 'obligatory' },
        { name: 'Ahorro/Inversión', percentage: 20, expenseType: 'savings_investment' },
        { name: 'Discrecional', percentage: 10, expenseType: 'discretionary' },
      ],
      isCustom: false,
    },
    '40/30/30': {
      name: '40/30/30',
      percentages: [
        { name: 'Obligatorios', percentage: 40, expenseType: 'obligatory' },
        { name: 'Ahorro/Inversión', percentage: 30, expenseType: 'savings_investment' },
        { name: 'Discrecional', percentage: 30, expenseType: 'discretionary' },
      ],
      isCustom: false,
    },
  };

  if (id.startsWith('default-')) {
    const defaultRule = DEFAULT_RULES[id.replace('default-', '')];
    if (!defaultRule) {
      return NextResponse.json({ error: 'Regla no encontrada' }, { status: 404 });
    }

    await dbConnect();

    await BudgetRule.updateMany(
      { workspace: auth.workspaceId, user: auth.userId },
      { $set: { isActive: false } }
    );

    const existingRule = await BudgetRule.findOne({
      workspace: auth.workspaceId,
      user: auth.userId,
      name: defaultRule.name,
    });

    if (existingRule) {
      const activated = await BudgetRule.findByIdAndUpdate(
        existingRule._id,
        { $set: { isActive: true } },
        { new: true, lean: true }
      );
      return NextResponse.json(JSON.parse(JSON.stringify(activated)) as any);
    }

    const activated = await BudgetRule.create({
      workspace: auth.workspaceId,
      user: auth.userId,
      ...defaultRule,
      isActive: true,
      totalPercentage: defaultRule.percentages.reduce((s: number, p: any) => s + p.percentage, 0),
    });

    return NextResponse.json(JSON.parse(JSON.stringify(activated)) as any);
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

  return NextResponse.json(JSON.parse(JSON.stringify(activated)) as any);
}
