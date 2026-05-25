import { NextRequest, NextResponse } from 'next/server';
import { getApiAuth } from '@/lib/auth/api';
import dbConnect from '@/lib/db/mongoose';
import { WorkspacePurchase } from '@/lib/models/workspace-purchase';

export async function GET(req: NextRequest) {
  try {
    const auth = await getApiAuth(req);
    if (!auth) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (auth.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    if (!auth.workspaceId) {
      return NextResponse.json({ error: 'Sin workspace asignado' }, { status: 403 });
    }

    await dbConnect();

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(5, parseInt(searchParams.get('limit') || '10')));

    const filter = { workspace: auth.workspaceId };
    const [raw, total] = await Promise.all([
      WorkspacePurchase.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      WorkspacePurchase.countDocuments(filter),
    ]);

    const items = raw.map((p) => {
      const purchasedAt = new Date(p.purchasedAt);
      const expiresAt = new Date(purchasedAt);
      expiresAt.setMonth(expiresAt.getMonth() + 1);

      return {
        _id: p._id.toString(),
        plan: p.plan?.toString(),
        planName: p.planName,
        amount: p.amount,
        currency: p.currency,
        status: p.status,
        modules: p.modules,
        purchasedAt: purchasedAt.toISOString(),
        expiresAt: expiresAt.toISOString(),
        createdAt: p.createdAt,
      };
    });

    return NextResponse.json({
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('[purchases] Error:', error);
    return NextResponse.json(
      { error: 'No se pudo cargar el historial de compras.' },
      { status: 500 }
    );
  }
}
