import { NextRequest, NextResponse } from 'next/server';
import { getApiAuth } from '@/lib/auth/api';
import dbConnect from '@/lib/db/mongoose';
import { WorkspacePurchase } from '@/lib/models/workspace-purchase';
import { recalculateQuotas } from '@/lib/purchase/recalculate-quotas';

export async function PATCH(req: NextRequest) {
  try {
    const auth = await getApiAuth(req);
    if (!auth) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (auth.role !== 'admin') {
      return NextResponse.json({ error: 'Solo administradores pueden gestionar compras' }, { status: 403 });
    }

    if (!auth.workspaceId) {
      return NextResponse.json({ error: 'Sin workspace asignado' }, { status: 403 });
    }

    const { status } = await req.json();

    if (!status || !['active', 'cancelled'].includes(status)) {
      return NextResponse.json({ error: 'Estado invalido' }, { status: 400 });
    }

    await dbConnect();

    const purchase = await WorkspacePurchase.findOne({
      _id: req.nextUrl.pathname.split('/').pop(),
      workspace: auth.workspaceId,
    });

    if (!purchase) {
      return NextResponse.json({ error: 'Compra no encontrada' }, { status: 404 });
    }

    purchase.status = status;
    await purchase.save();

    await recalculateQuotas(auth.workspaceId.toString());

    return NextResponse.json({
      success: true,
      purchase: {
        _id: purchase._id,
        planName: purchase.planName,
        amount: purchase.amount,
        currency: purchase.currency,
        status: purchase.status,
        purchasedAt: purchase.purchasedAt,
      },
    });
  } catch (error) {
    console.error('[purchase-toggle] Error:', error);
    return NextResponse.json(
      { error: 'No se pudo actualizar el estado de la compra.' },
      { status: 500 }
    );
  }
}
