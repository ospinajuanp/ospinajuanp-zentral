import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import dbConnect from '@/lib/db/mongoose';
import { getApiAuth } from '@/lib/auth/api';
import { checkFeatureEnabled } from '@/lib/settings/guard';
import { DebtPayment } from '@/lib/models/debt-payment';
import type { IDebtPayment } from '@/lib/models/debt-payment';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getApiAuth(req);
  if (!auth || !auth.workspaceId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const check = await checkFeatureEnabled(req, 'personalFinanceEnabled');
  if (check) return check;

  const { id } = await params;

  await dbConnect();

  const payments = await DebtPayment.find({
    debtId: id,
    workspace: auth.workspaceId,
    user: auth.userId,
  })
    .sort({ paymentDate: -1 })
    .lean();

  return NextResponse.json({
    items: JSON.parse(JSON.stringify(payments)) as IDebtPayment[],
    total: payments.length,
  });
}
