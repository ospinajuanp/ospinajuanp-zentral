import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getApiAuth } from '@/lib/auth/api';
import { checkFeatureEnabled } from '@/lib/settings/guard';
import { getFinancialPosition, recalculateFinancialPosition } from '@/lib/modules/personalfinance/financial-position';

export async function GET(req: NextRequest) {
  const auth = await getApiAuth(req);
  if (!auth || !auth.workspaceId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const check = await checkFeatureEnabled(req, 'personalFinanceEnabled');
  if (check) return check;

  try {
    const position = await getFinancialPosition(auth.workspaceId, auth.userId);
    return NextResponse.json(position);
  } catch (error) {
    console.error('Error getting financial position:', error);
    return NextResponse.json({ error: 'Error al obtener posición financiera' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await getApiAuth(req);
  if (!auth || !auth.workspaceId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const check = await checkFeatureEnabled(req, 'personalFinanceEnabled');
  if (check) return check;

  try {
    const position = await recalculateFinancialPosition(auth.workspaceId, auth.userId);
    return NextResponse.json(position);
  } catch (error) {
    console.error('Error recalculating financial position:', error);
    return NextResponse.json({ error: 'Error al recalcular posición financiera' }, { status: 500 });
  }
}
