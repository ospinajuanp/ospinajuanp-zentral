import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongoose';
import { ModuleSubscription } from '@/lib/models/module-subscription';
import { Module } from '@/lib/models/module';
import { getApiAuth } from '@/lib/auth/api';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await getApiAuth(req);
    if (!auth || auth.role !== 'superadmin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { id } = await params;
    await dbConnect();

    const subscriptions = await ModuleSubscription.find({ workspace: id }).lean();

    return NextResponse.json({ subscriptions });
  } catch {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await getApiAuth(req);
    if (!auth || auth.role !== 'superadmin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { moduleKey, tier, status, monthlyQuota } = body;

    if (!moduleKey) {
      return NextResponse.json({ error: 'moduleKey es requerido' }, { status: 400 });
    }

    await dbConnect();

    const mod = await Module.findOne({ key: moduleKey.toLowerCase() });
    if (!mod) {
      return NextResponse.json({ error: 'Módulo no encontrado en el catálogo' }, { status: 404 });
    }

    const existing = await ModuleSubscription.findOne({ workspace: id, moduleKey: moduleKey.toLowerCase() });
    if (existing) {
      return NextResponse.json({ error: 'El workspace ya tiene este módulo' }, { status: 409 });
    }

    const quota = monthlyQuota ?? mod.defaultQuota;

    const sub = await ModuleSubscription.create({
      workspace: id,
      moduleKey: moduleKey.toLowerCase(),
      tier: tier ?? mod.tier,
      status: status ?? 'active',
      monthlyQuota: quota,
      usedQuota: 0,
    });

    return NextResponse.json({ subscription: sub }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
