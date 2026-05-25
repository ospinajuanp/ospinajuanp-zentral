import { NextRequest, NextResponse } from 'next/server';
import { getApiAuth } from '@/lib/auth/api';
import dbConnect from '@/lib/db/mongoose';
import { WorkspacePurchase } from '@/lib/models/workspace-purchase';
import { recalculateQuotas } from '@/lib/purchase/recalculate-quotas';

export async function POST(req: NextRequest) {
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

    await dbConnect();

    // Extract purchaseId from URL: /api/workspaces/[id]/purchases/[purchaseId]/reactivate
    const segments = req.nextUrl.pathname.split('/');
    const purchaseId = segments[segments.length - 2];

    const original = await WorkspacePurchase.findOne({
      _id: purchaseId,
      workspace: auth.workspaceId,
    });

    if (!original) {
      return NextResponse.json({ error: 'Compra original no encontrada' }, { status: 404 });
    }

    // Create a new purchase record preserving the original period and data
    const purchase = await WorkspacePurchase.create({
      workspace: original.workspace,
      plan: original.plan,
      planName: original.planName,
      amount: original.amount,
      currency: original.currency,
      status: 'active',
      paymentMethod: 'reactivated',
      modules: original.modules,
      purchasedAt: original.purchasedAt,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Ensure original stays cancelled
    if (original.status !== 'cancelled') {
      original.status = 'cancelled';
      await original.save();
    }

    await recalculateQuotas(auth.workspaceId.toString());

    return NextResponse.json({
      success: true,
      purchase: {
        _id: purchase._id,
        planName: purchase.planName,
        amount: purchase.amount,
        currency: purchase.currency,
        status: purchase.status,
        paymentMethod: purchase.paymentMethod,
        purchasedAt: purchase.purchasedAt,
      },
    });
  } catch (error) {
    console.error('[purchase-reactivate] Error:', error);
    return NextResponse.json(
      { error: 'No se pudo reactivar la compra.' },
      { status: 500 }
    );
  }
}
