import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import dbConnect from '@/lib/db/mongoose';
import { getApiAuth } from '@/lib/auth/api';
import { checkFeatureEnabled } from '@/lib/settings/guard';
import { BudgetRule } from '@/lib/models/personalfinance-budget-rule';
import { consumeQuota } from '@/lib/modules/personalfinance/quota';
import type { IBudgetRule } from '@/lib/models/personalfinance-budget-rule';

const DEFAULT_RULES = [
  { name: '50/30/20', percentages: { obligatory: 50, savingsInvestment: 30, discretionary: 20 }, isCustom: false },
  { name: '70/20/10', percentages: { obligatory: 70, savingsInvestment: 20, discretionary: 10 }, isCustom: false },
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

  const customRules = rules as unknown as IBudgetRule[];
  const activeRules = customRules.filter((r) => r.isActive);
  const hasDefaultRules = customRules.some((r) => !r.isCustom && r.name === '50/30/20');

  const response: any = {
    items: customRules,
    total: customRules.length,
    activeRule: activeRules.length > 0 ? activeRules[0] : null,
  };

  if (!hasDefaultRules) {
    const allRules = [
      ...DEFAULT_RULES.map((r) => ({
        ...r,
        _id: `default-${r.name}`,
        workspace: auth.workspaceId,
        user: auth.userId,
        isActive: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
      ...customRules,
    ];
    response.items = allRules;
    response.total = allRules.length;
  }

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

  if (!name || !percentages) {
    return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
  }

  const { obligatory, savingsInvestment, discretionary } = percentages;
  const total = (obligatory || 0) + (savingsInvestment || 0) + (discretionary || 0);

  if (total !== 100) {
    return NextResponse.json(
      { error: `Los porcentajes deben sumar exactamente 100%. Suma actual: ${total}%` },
      { status: 400 }
    );
  }

  await dbConnect();

  if (isActive) {
    await BudgetRule.updateMany(
      { workspace: auth.workspaceId, user: auth.userId },
      { $set: { isActive: false } }
    );
  }

  const rule = await BudgetRule.create({
    workspace: auth.workspaceId,
    user: auth.userId,
    name,
    percentages,
    isActive: isActive || false,
    isCustom: true,
  });

  return NextResponse.json(JSON.parse(JSON.stringify(rule)) as IBudgetRule, { status: 201 });
}
