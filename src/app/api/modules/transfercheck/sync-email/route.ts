import { NextRequest, NextResponse } from 'next/server';
import { getApiAuth } from '@/lib/auth/api';
import { processPendingMatches } from '@/lib/modules/transfercheck/matcher';

export async function POST(req: NextRequest) {
  try {
    const auth = await getApiAuth(req);
    if (!auth) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const refreshToken = process.env.GMAIL_REFRESH_TOKEN;
    if (!refreshToken) {
      return NextResponse.json(
        { error: 'Gmail no configurado. Contacta al administrador.' },
        { status: 400 }
      );
    }

    const processed = await processPendingMatches(refreshToken);

    return NextResponse.json({ success: true, processed });
  } catch (error) {
    console.error('[sync-email] Error:', error);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
