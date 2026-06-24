import { NextRequest, NextResponse } from 'next/server';
import { getApiAuth } from '@/lib/auth/api';
import { checkFeatureEnabled } from '@/lib/settings/guard';
import dbConnect from '@/lib/db/mongoose';
import { PersonalFinanceIncome } from '@/lib/models/personalfinance-income';
import { PersonalFinanceExpense } from '@/lib/models/personalfinance-expense';

export async function GET(req: NextRequest) {
  try {
    const auth = await getApiAuth(req);
    if (!auth || !auth.workspaceId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const check = await checkFeatureEnabled(req, 'personalFinanceEnabled');
    if (check) return check;

    await dbConnect();

    const currentYear = new Date().getFullYear();

    const [incomeYears, expenseYears] = await Promise.all([
      PersonalFinanceIncome.find({
        workspace: auth.workspaceId,
        user: auth.userId,
      })
        .select('date')
        .lean(),
      PersonalFinanceExpense.find({
        workspace: auth.workspaceId,
        user: auth.userId,
      })
        .select('date')
        .lean(),
    ]);

    const yearsSet = new Set<number>();
    yearsSet.add(currentYear);

    for (const doc of incomeYears) {
      const d = doc.date as unknown as Date;
      yearsSet.add(d.getFullYear());
    }
    for (const doc of expenseYears) {
      const d = doc.date as unknown as Date;
      yearsSet.add(d.getFullYear());
    }

    const years = Array.from(yearsSet).sort((a, b) => b - a);

    return NextResponse.json({ years, minYear: years[years.length - 1], maxYear: years[0] });
  } catch (error) {
    console.error('[personalfinance-years] Error:', error);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
