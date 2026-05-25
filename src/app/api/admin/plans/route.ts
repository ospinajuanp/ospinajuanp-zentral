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

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(5, parseInt(searchParams.get('limit') || '10')));

    const [plans, total] = await Promise.all([
      Plan.find()
        .populate('includedModules.module', 'key name defaultQuota tier')
        .sort({ sortOrder: 1, name: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Plan.countDocuments(),
    ]);

    return NextResponse.json({
      items: plans,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
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
    const { name, price, monthlyPrice, description, includedModules, maxUsers, extraFeatures, support, onboarding, cta, ctaLink, highlighted, isEnterprise, whatsappNumber, sortOrder, isActive } = body;

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
      maxUsers: maxUsers ?? 0,
      extraFeatures: extraFeatures ?? [],
      support: support ?? 'ninguno',
      onboarding: onboarding ?? 'ninguno',
      cta: cta ?? 'Empezar',
      ctaLink: ctaLink ?? (isEnterprise && whatsappNumber ? `https://wa.me/${whatsappNumber.replace(/\D/g, '')}` : '/register'),
      highlighted: highlighted ?? false,
      isEnterprise: isEnterprise ?? false,
      whatsappNumber: whatsappNumber ?? '',
      sortOrder: sortOrder ?? 0,
      isActive: isActive ?? true,
    });

    // Update ctaLink with real plan ID if not enterprise
    if (!isEnterprise) {
      plan.ctaLink = `/register?plan=${plan._id}`;
      await plan.save();
    }

    return NextResponse.json({ plan: await Plan.findById(plan._id).populate('includedModules.module', 'key name defaultQuota tier') }, { status: 201 });
  } catch (err) {
    console.error('[plans POST]', err);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
