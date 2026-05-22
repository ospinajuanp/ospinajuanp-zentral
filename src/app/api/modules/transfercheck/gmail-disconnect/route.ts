import { NextRequest, NextResponse } from 'next/server';
import { getApiAuth } from '@/lib/auth/api';
import { disconnectGmail } from '@/lib/models/workspace-settings';

export async function POST(req: NextRequest) {
  try {
    const auth = await getApiAuth(req);
    if (!auth || !auth.workspaceId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    await disconnectGmail(auth.workspaceId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[gmail-disconnect] Error:', error);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
