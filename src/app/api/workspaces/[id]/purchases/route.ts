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

    const purchases = (await WorkspacePurchase.find({
      workspace: auth.workspaceId,
    })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean()).map((p) => {
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

    return NextResponse.json({ purchases });
  } catch (error) {
    console.error('[purchases] Error:', error);
    return NextResponse.json(
      { error: 'No se pudo cargar el historial de compras.' },
      { status: 500 }
    );
  }
}
