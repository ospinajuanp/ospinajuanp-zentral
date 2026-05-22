import { NextRequest, NextResponse } from 'next/server';
import { getApiAuth } from '@/lib/auth/api';
import { getAuthUrl } from '@/lib/modules/transfercheck/gmail-service';

export async function GET(req: NextRequest) {
  try {
    const auth = await getApiAuth(req);
    if (!auth) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const state = encodeURIComponent(JSON.stringify({
      workspaceId: auth.workspaceId,
      redirect: req.nextUrl.searchParams.get('redirect') || '/transfercheck',
    }));

    const url = getAuthUrl();

    const authUrl = `${url}&state=${state}`;

    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('[gmail-connect] Error:', error);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
