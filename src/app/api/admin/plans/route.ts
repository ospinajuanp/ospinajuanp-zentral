import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongoose';
import { Plan } from '@/lib/models/plan';
import { getApiAuth } from '@/lib/auth/api';

export async function GET(req: NextRequest) {
  try {
    const auth = await getApiAuth(req);
    if (!auth || auth.role !== 'superadmin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    await dbConnect();
    const plans = await Plan.find().sort({ sortOrder: 1, name: 1 }).lean();

    return NextResponse.json({ plans });
  } catch {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getApiAuth(req);
    if (!auth || auth.role !== 'superadmin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const body = await req.json();
    const { name, price, monthlyPrice, description, features, cta, highlighted, sortOrder, isActive } = body;

    if (!name || !price) {
      return NextResponse.json({ error: 'name y price son requeridos' }, { status: 400 });
    }

    await dbConnect();

    const plan = await Plan.create({
      name,
      price,
      monthlyPrice: monthlyPrice ?? null,
      description: description ?? '',
      features: features ?? [],
      cta: cta ?? 'Empezar',
      highlighted: highlighted ?? false,
      sortOrder: sortOrder ?? 0,
      isActive: isActive ?? true,
    });

    return NextResponse.json({ plan }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
