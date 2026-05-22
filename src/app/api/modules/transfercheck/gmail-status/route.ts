import { NextRequest, NextResponse } from 'next/server';
import { getApiAuth } from '@/lib/auth/api';
import { getGmailStatus } from '@/lib/modules/transfercheck/gmail-service';

export async function GET(req: NextRequest) {
  try {
    const auth = await getApiAuth(req);
    if (!auth || !auth.workspaceId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const status = await getGmailStatus(auth.workspaceId);

    return NextResponse.json(status);
  } catch (error) {
    console.error('[gmail-status] Error:', error);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
