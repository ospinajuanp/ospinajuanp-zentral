import { NextRequest, NextResponse } from 'next/server';
import { getTokensFromCode } from '@/lib/modules/transfercheck/gmail-service';
import { setGmailTokens } from '@/lib/models/workspace-settings';

export async function GET(req: NextRequest) {
  try {
    const code = req.nextUrl.searchParams.get('code');
    const stateParam = req.nextUrl.searchParams.get('state');

    if (!code) {
      return NextResponse.redirect(new URL('/transfercheck?error=No+se+recibio+el+codigo', req.url));
    }

    let workspaceId = '';
    let redirectTo = '/transfercheck';

    if (stateParam) {
      try {
        const state = JSON.parse(decodeURIComponent(stateParam));
        workspaceId = state.workspaceId || '';
        redirectTo = state.redirect || '/transfercheck';
      } catch {
        // state parse failed, use defaults
      }
    }

    const tokens = await getTokensFromCode(code);

    if (!tokens.refresh_token) {
      return NextResponse.redirect(new URL(`${redirectTo}?error=No+se+pudo+obtener+el+refresh+token`, req.url));
    }

    const expiryDate = tokens.expiry_date
      ? new Date(tokens.expiry_date)
      : new Date(Date.now() + 3600 * 1000);

    if (workspaceId) {
      await setGmailTokens(workspaceId, tokens.refresh_token, tokens.access_token || '', expiryDate);
    }

    return NextResponse.redirect(new URL(`${redirectTo}?gmail=connected`, req.url));
  } catch (error) {
    console.error('[gmail-callback] Error:', error);
    return NextResponse.redirect(new URL('/transfercheck?error=Error+al+conectar+Gmail', req.url));
  }
}
