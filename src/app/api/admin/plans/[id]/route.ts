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
    const plan = await Plan.findById(id)
      .populate('includedModules.module', 'key name defaultQuota tier');

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
    const { name, price, monthlyPrice, description, includedModules, maxUsers, extraFeatures, support, onboarding, cta, ctaLink, highlighted, isEnterprise, sortOrder, isActive } = body;

    await dbConnect();

    const update: Record<string, unknown> = {};
    if (name !== undefined) update.name = name;
    if (price !== undefined) update.price = price;
    if (monthlyPrice !== undefined) update.monthlyPrice = monthlyPrice;
    if (description !== undefined) update.description = description;
    if (includedModules !== undefined) update.includedModules = includedModules;
    if (maxUsers !== undefined) update.maxUsers = maxUsers;
    if (extraFeatures !== undefined) update.extraFeatures = extraFeatures;
    if (support !== undefined) update.support = support;
    if (onboarding !== undefined) update.onboarding = onboarding;
    if (cta !== undefined) update.cta = cta;
    if (ctaLink !== undefined) update.ctaLink = ctaLink;
    if (highlighted !== undefined) update.highlighted = highlighted;
    if (isEnterprise !== undefined) update.isEnterprise = isEnterprise;
    if (sortOrder !== undefined) update.sortOrder = sortOrder;
    if (isActive !== undefined) update.isActive = isActive;

    const plan = await Plan.findByIdAndUpdate(id, { $set: update }, { new: true, runValidators: true })
      .populate('includedModules.module', 'key name defaultQuota tier');

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
