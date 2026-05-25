import { NextRequest, NextResponse } from 'next/server';
import { getApiAuth } from '@/lib/auth/api';
import { processPendingMatches } from '@/lib/modules/transfercheck/matcher';

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

    const result = await processPendingMatches(workspaceId);

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
