import { NextRequest, NextResponse } from 'next/server';
import { getApiAuth } from '@/lib/auth/api';
import dbConnect from '@/lib/db/mongoose';
import { TransferCheckLog } from '@/lib/models/transfercheck-log';

export async function GET(req: NextRequest) {
  try {
    const auth = await getApiAuth(req);
    if (!auth) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (auth.role !== 'admin' && auth.role !== 'superadmin') {
      return NextResponse.json({ error: 'Solo administradores' }, { status: 403 });
    }

    if (!auth.workspaceId) {
      return NextResponse.json({ error: 'Sin workspace asignado' }, { status: 403 });
    }

    const url = new URL(req.url);
    const fechaDesde = url.searchParams.get('fechaDesde');
    const fechaHasta = url.searchParams.get('fechaHasta');

    const today = new Date();
    const from = fechaDesde
      ? new Date(fechaDesde + 'T00:00:00.000Z')
      : new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);
    const to = fechaHasta
      ? new Date(fechaHasta + 'T23:59:59.999Z')
      : new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

    await dbConnect();

    const filter = {
      workspace: auth.workspaceId,
      createdAt: { $gte: from, $lte: to },
    };

    const logs = await TransferCheckLog.find(filter)
      .sort({ createdAt: -1 })
      .populate('userId', 'name email')
      .populate('resolvedBy', 'name email')
      .lean();

    const automáticos = logs.filter((l) => l.status === 'matched' && !l.resolvedBy);
    const manuales = logs.filter((l) => l.status === 'matched' && l.resolvedBy);
    const errores = logs.filter((l) => l.status === 'manual_error');

    const stats = {
      totalConciliados: automáticos.length + manuales.length,
      conciliadosAutomaticos: automáticos.length,
      conciliadosManuales: manuales.length,
      totalErrorManual: errores.length,
      montoConciliados: automáticos.reduce((s, l) => s + l.photoData.monto, 0) + manuales.reduce((s, l) => s + l.photoData.monto, 0),
      montoAutomaticos: automáticos.reduce((s, l) => s + l.photoData.monto, 0),
      montoManuales: manuales.reduce((s, l) => s + l.photoData.monto, 0),
      montoErrorManual: errores.reduce((s, l) => s + l.photoData.monto, 0),
    };

    return NextResponse.json({ stats, logs });
  } catch (error) {
    console.error('[consolidado] Error:', error);
    return NextResponse.json(
      { error: 'No se pudo cargar el consolidado.' },
      { status: 500 }
    );
  }
}
