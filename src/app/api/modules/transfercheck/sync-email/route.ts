import { NextRequest, NextResponse } from 'next/server';
import { getApiAuth } from '@/lib/auth/api';
import { processPendingMatches, consumeQuota, checkQuota } from '@/lib/modules/transfercheck/matcher';

export async function POST(req: NextRequest) {
  try {
    const auth = await getApiAuth(req);
    if (!auth) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const workspaceId = auth.workspaceId;
    if (!workspaceId) {
      return NextResponse.json({ error: 'Sin workspace asignado' }, { status: 403 });
    }

    const quota = await checkQuota(workspaceId);
    if (!quota.allowed) {
      return NextResponse.json(
        { error: 'Sin cuota disponible este mes. Contacta a tu administrador.' },
        { status: 429 }
      );
    }

    const result = await processPendingMatches(workspaceId, quota.remaining);

    if (result.processed > 0) {
      await consumeQuota(workspaceId, result.processed);
    }

    return NextResponse.json({
      success: true,
      processed: result.processed,
      results: result.results,
    });
  } catch (error) {
    console.error('[sync-email] Error:', error);
    return NextResponse.json(
      { error: 'No se pudo verificar los pagos en este momento. Reintenta en unos minutos.' },
      { status: 500 }
    );
  }
}
