import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import dbConnect from '@/lib/db/mongoose';
import { AuditLog } from '@/lib/models/audit-log';
import { getApiAuth } from '@/lib/auth/api';

export async function GET(request: NextRequest) {
  const auth = await getApiAuth(request);
  if (!auth) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  if (auth.role === 'operador') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const limit = Math.min(100, Math.max(5, parseInt(searchParams.get('limit') || '20')));
  const entity = searchParams.get('entity');
  const action = searchParams.get('action');
  const userId = searchParams.get('userId');

  await dbConnect();

  const filter: Record<string, unknown> = {};
  if (entity) filter.entity = entity;
  if (action) filter.action = action;
  if (userId) filter.userId = userId;

  if (auth.role === 'admin' && auth.workspaceId) {
    filter.workspaceId = auth.workspaceId;
  }

  const [logs, total] = await Promise.all([
    AuditLog.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    AuditLog.countDocuments(filter),
  ]);

  return NextResponse.json({
    items: logs,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
}