import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongoose';
import { Module } from '@/lib/models/module';
import { getApiAuth } from '@/lib/auth/api';

export async function GET(req: NextRequest) {
  try {
    const auth = await getApiAuth(req);
    if (!auth || auth.role !== 'superadmin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    await dbConnect();
    const modules = await Module.find().sort({ key: 1 }).lean();

    return NextResponse.json({ modules });
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
    const { key, name, description, tier, status, defaultQuota, icon } = body;

    if (!key || !name) {
      return NextResponse.json({ error: 'key y name son requeridos' }, { status: 400 });
    }

    await dbConnect();

    const existing = await Module.findOne({ key: key.toLowerCase() });
    if (existing) {
      return NextResponse.json({ error: 'Ya existe un módulo con esa key' }, { status: 409 });
    }

    const mod = await Module.create({
      key: key.toLowerCase(),
      name,
      description: description ?? '',
      tier: tier ?? 'free',
      status: status ?? 'active',
      defaultQuota: defaultQuota ?? 100,
      icon: icon ?? null,
    });

    return NextResponse.json({ module: mod }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
