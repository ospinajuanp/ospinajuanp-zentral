import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongoose';
import { Plan } from '@/lib/models/plan';
import { getApiAuth } from '@/lib/auth/api';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await getApiAuth(req);
    if (!auth || auth.role !== 'superadmin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { id } = await params;
    await dbConnect();
    const plan = await Plan.findById(id);

    if (!plan) {
      return NextResponse.json({ error: 'Plan no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ plan });
  } catch {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await getApiAuth(req);
    if (!auth || auth.role !== 'superadmin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { name, price, monthlyPrice, description, features, cta, highlighted, sortOrder, isActive } = body;

    await dbConnect();

    const update: Record<string, unknown> = {};
    if (name !== undefined) update.name = name;
    if (price !== undefined) update.price = price;
    if (monthlyPrice !== undefined) update.monthlyPrice = monthlyPrice;
    if (description !== undefined) update.description = description;
    if (features !== undefined) update.features = features;
    if (cta !== undefined) update.cta = cta;
    if (highlighted !== undefined) update.highlighted = highlighted;
    if (sortOrder !== undefined) update.sortOrder = sortOrder;
    if (isActive !== undefined) update.isActive = isActive;

    const plan = await Plan.findByIdAndUpdate(id, { $set: update }, { new: true, runValidators: true });

    if (!plan) {
      return NextResponse.json({ error: 'Plan no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ plan });
  } catch {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await getApiAuth(req);
    if (!auth || auth.role !== 'superadmin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { id } = await params;
    await dbConnect();
    const plan = await Plan.findByIdAndDelete(id);

    if (!plan) {
      return NextResponse.json({ error: 'Plan no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Plan eliminado' });
  } catch {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
