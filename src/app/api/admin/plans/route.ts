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
    const plans = await Plan.find()
      .populate('includedModules.module', 'key name defaultQuota tier')
      .sort({ sortOrder: 1, name: 1 })
      .lean();

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
    const { name, price, monthlyPrice, description, includedModules, maxUsers, extraFeatures, support, onboarding, cta, ctaLink, highlighted, sortOrder, isActive } = body;

    if (!name) {
      return NextResponse.json({ error: 'name es requerido' }, { status: 400 });
    }

    await dbConnect();

    const plan = await Plan.create({
      name,
      price,
      monthlyPrice: monthlyPrice ?? null,
      description: description ?? '',
      includedModules: includedModules ?? [],
      maxUsers: maxUsers ?? 1,
      extraFeatures: extraFeatures ?? [],
      support: support ?? 'ninguno',
      onboarding: onboarding ?? 'ninguno',
      cta: cta ?? 'Empezar',
      ctaLink: ctaLink ?? '/register',
      highlighted: highlighted ?? false,
      sortOrder: sortOrder ?? 0,
      isActive: isActive ?? true,
    });

    return NextResponse.json({ plan: await Plan.findById(plan._id).populate('includedModules.module', 'key name defaultQuota tier') }, { status: 201 });
  } catch (err) {
    console.error('[plans POST]', err);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
