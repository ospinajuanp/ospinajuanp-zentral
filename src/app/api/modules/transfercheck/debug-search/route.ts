import { NextRequest, NextResponse } from 'next/server';
import { getApiAuth } from '@/lib/auth/api';
import dbConnect from '@/lib/db/mongoose';
import { TransferCheckLog } from '@/lib/models/transfercheck-log';
import { debugSearchTransferEmails } from '@/lib/modules/transfercheck/gmail-service';

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

    const { logId } = await req.json();

    if (!logId) {
      return NextResponse.json({ error: 'logId requerido' }, { status: 400 });
    }

    await dbConnect();
    const log = await TransferCheckLog.findById(logId);

    if (!log) {
      return NextResponse.json({ error: 'Log no encontrado' }, { status: 404 });
    }

    const result = await debugSearchTransferEmails(log.photoData, workspaceId);

    return NextResponse.json(result);
  } catch (error) {
    console.error('[debug-search] Error:', error);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
