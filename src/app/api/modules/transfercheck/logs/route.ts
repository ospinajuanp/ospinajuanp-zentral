import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongoose';
import { TransferCheckLog } from '@/lib/models/transfercheck-log';
import { getApiAuth } from '@/lib/auth/api';

export async function GET(req: NextRequest) {
  try {
    const auth = await getApiAuth(req);
    if (!auth) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const url = new URL(req.url);
    const status = url.searchParams.get('status') || undefined;
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get('limit') || '20')));
    const fechaDesde = url.searchParams.get('fechaDesde') || undefined;
    const fechaHasta = url.searchParams.get('fechaHasta') || undefined;

    const workspaceId = auth.role === 'superadmin'
      ? url.searchParams.get('workspaceId') || undefined
      : auth.workspaceId;

    if (!workspaceId) {
      return NextResponse.json({ error: 'Sin workspace asignado' }, { status: 403 });
    }

    await dbConnect();

    const filter: Record<string, unknown> = { workspace: workspaceId };
    if (status) filter.status = status;

    if (fechaDesde || fechaHasta) {
      const dateFilter: Record<string, Date> = {};
      if (fechaDesde) dateFilter.$gte = new Date(fechaDesde + 'T00:00:00.000Z');
      if (fechaHasta) dateFilter.$lte = new Date(fechaHasta + 'T23:59:59.999Z');
      filter.createdAt = dateFilter;
    }

    const [logs, total] = await Promise.all([
      TransferCheckLog.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('userId', 'name email')
        .populate('resolvedBy', 'name email')
        .lean(),
      TransferCheckLog.countDocuments(filter),
    ]);

    return NextResponse.json({
      logs,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('[transfercheck-logs] Error:', error);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const auth = await getApiAuth(req);
    if (!auth) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const { logId, monto, referencia, fecha } = body;

    if (!logId || !monto || !referencia) {
      return NextResponse.json(
        { error: 'logId, monto y referencia son requeridos' },
        { status: 400 }
      );
    }

    await dbConnect();

    const log = await TransferCheckLog.findById(logId);
    if (!log) {
      return NextResponse.json({ error: 'Log no encontrado' }, { status: 404 });
    }

    const workspaceId = auth.role === 'superadmin'
      ? auth.workspaceId
      : String(log.workspace);

    if (String(log.workspace) !== workspaceId && auth.role !== 'superadmin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    log.status = 'matched';
    log.manualData = {
      monto: Number(monto),
      referencia: String(referencia).trim(),
      fecha: fecha || new Date().toISOString().split('T')[0],
    };
    log.resolvedBy = auth.userId as unknown as typeof log.resolvedBy;
    log.matchedAt = new Date();
    log.nextRetryAt = null;
    await log.save();

    await log.populate('resolvedBy', 'name email');

    return NextResponse.json({ success: true, log });
  } catch (error) {
    console.error('[transfercheck-logs] Error:', error);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
