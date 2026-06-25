import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import dbConnect from '@/lib/db/mongoose';
import { getApiAuth } from '@/lib/auth/api';
import { checkFeatureEnabled } from '@/lib/settings/guard';
import { BudgetRule } from '@/lib/models/personalfinance-budget-rule';
import { consumeQuota } from '@/lib/modules/personalfinance/quota';
import type { IBudgetCategory } from '@/lib/models/personalfinance-budget-rule';

const DEFAULT_RULES = [
  {
    name: '50/30/20',
    percentages: [
      { name: 'Obligatorios', percentage: 50, expenseType: 'obligatory' as const },
      { name: 'Ahorro/Inversión', percentage: 30, expenseType: 'savings_investment' as const },
      { name: 'Discrecional', percentage: 20, expenseType: 'discretionary' as const },
    ],
    isCustom: false,
  },
  {
    name: '70/20/10',
    percentages: [
      { name: 'Obligatorios', percentage: 70, expenseType: 'obligatory' as const },
      { name: 'Ahorro/Inversión', percentage: 20, expenseType: 'savings_investment' as const },
      { name: 'Discrecional', percentage: 10, expenseType: 'discretionary' as const },
    ],
    isCustom: false,
  },
  {
    name: '40/30/30',
    percentages: [
      { name: 'Obligatorios', percentage: 40, expenseType: 'obligatory' as const },
      { name: 'Ahorro/Inversión', percentage: 30, expenseType: 'savings_investment' as const },
      { name: 'Discrecional', percentage: 30, expenseType: 'discretionary' as const },
    ],
    isCustom: false,
  },
];

export async function GET(req: NextRequest) {
  const auth = await getApiAuth(req);
  if (!auth || !auth.workspaceId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const check = await checkFeatureEnabled(req, 'personalFinanceEnabled');
  if (check) return check;

  await dbConnect();

  const rules = await BudgetRule.find({
    workspace: auth.workspaceId,
    user: auth.userId,
  }).lean();

  const customRules = rules as unknown as any[];
  const activeRule = customRules.find((r: any) => r.isActive);
  const activeRuleName = activeRule?.name || null;

  const allRules = [
    ...DEFAULT_RULES.map((r) => ({
      ...r,
      _id: `default-${r.name}`,
      workspace: auth.workspaceId,
      user: auth.userId,
      isActive: activeRuleName === r.name,
      totalPercentage: r.percentages.reduce((s, p) => s + p.percentage, 0),
      createdAt: new Date(),
      updatedAt: new Date(),
    })),
    ...customRules.map((r: any) => ({
      ...r,
      _id: r._id.toString(),
      isActive: r.isActive,
    })),
  ];

  const response = {
    items: allRules,
    total: allRules.length,
    activeRule: activeRule
      ? { ...activeRule, _id: activeRule._id.toString() }
      : activeRuleName
        ? allRules.find((r) => r._id === `default-${activeRuleName}`)
        : null,
  };

  return NextResponse.json(response);
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
  const { name, percentages, isActive } = body;

  if (!name || !percentages || !Array.isArray(percentages)) {
    return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
  }

  if (percentages.length === 0) {
    return NextResponse.json({ error: 'Debe haber al menos una categoría' }, { status: 400 });
  }

  await dbConnect();

  if (isActive) {
    await BudgetRule.updateMany(
      { workspace: auth.workspaceId, user: auth.userId },
      { $set: { isActive: false } }
    );
  }

  const totalPercentage = (percentages as IBudgetCategory[]).reduce((sum, p) => sum + (p.percentage || 0), 0);

  const rule = await BudgetRule.create({
    workspace: auth.workspaceId,
    user: auth.userId,
    name,
    percentages,
    totalPercentage,
    isActive: isActive || false,
    isCustom: true,
  });

  return NextResponse.json(JSON.parse(JSON.stringify(rule)) as any, { status: 201 });
}
