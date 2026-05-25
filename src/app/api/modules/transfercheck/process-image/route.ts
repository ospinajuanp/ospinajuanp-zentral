import { NextRequest, NextResponse } from 'next/server';
import { getApiAuth } from '@/lib/auth/api';
import { extractTransferData } from '@/lib/modules/transfercheck/extractor';
import { createTransferCheckLog, processPendingMatch, checkQuota, consumeQuota } from '@/lib/modules/transfercheck/matcher';
import { TransferCheckLog } from '@/lib/models/transfercheck-log';
import { getGmailStatus } from '@/lib/modules/transfercheck/gmail-service';
import '@/lib/models/user';

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

    // Verificar que Gmail esté conectado antes de consumir cuota o procesar
    const gmailStatus = await getGmailStatus(workspaceId);
    if (!gmailStatus.connected) {
      return NextResponse.json(
        {
          error: 'Conecta tu correo de Gmail antes de procesar comprobantes.',
          gmailRequired: true,
        },
        { status: 400 }
      );
    }

    const quota = await checkQuota(workspaceId);
    if (!quota.allowed) {
      return NextResponse.json(
        { error: 'Llegaste al límite de procesamientos de este mes. Contacta a tu administrador.' },
        { status: 429 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Archivo requerido' }, { status: 400 });
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Solo se permiten imágenes' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const extraction = await extractTransferData(buffer, file.type);

    if (!extraction.success || !extraction.data) {
      return NextResponse.json(
        { error: extraction.error || 'No se pudo procesar la imagen' },
        { status: 422 }
      );
    }

    const log = await createTransferCheckLog(workspaceId, auth.userId, extraction.data);

    const consumed = await consumeQuota(workspaceId);
    if (!consumed.consumed) {
      return NextResponse.json(
        { error: 'Llegaste al limite de procesamientos de este mes. Contacta a tu administrador.' },
        { status: 429 }
      );
    }

    await processPendingMatch(String(log._id), workspaceId);

    const updatedLog = await TransferCheckLog.findById(log._id).populate('userId', 'name email');

    return NextResponse.json({
      success: true,
      log: updatedLog,
      quota: { remaining: consumed.remaining, used: quota.remaining - 1 },
    });
  } catch (error) {
    console.error('[process-image] Error:', error);
    return NextResponse.json(
      { error: 'No se pudo procesar la imagen en este momento. Reintenta en unos minutos.' },
      { status: 500 }
    );
  }
}
