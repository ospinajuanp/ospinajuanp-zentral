import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongoose';
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
    const mod = await Module.findById(id);

    if (!mod) {
      return NextResponse.json({ error: 'Módulo no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ module: mod });
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
    const { name, description, tier, status, defaultQuota, icon } = body;

    await dbConnect();

    const update: Record<string, unknown> = {};
    if (name !== undefined) update.name = name;
    if (description !== undefined) update.description = description;
    if (tier !== undefined) update.tier = tier;
    if (status !== undefined) update.status = status;
    if (defaultQuota !== undefined) update.defaultQuota = defaultQuota;
    if (icon !== undefined) update.icon = icon;

    const mod = await Module.findByIdAndUpdate(id, { $set: update }, { new: true, runValidators: true });

    if (!mod) {
      return NextResponse.json({ error: 'Módulo no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ module: mod });
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

    const mod = await Module.findByIdAndDelete(id);

    if (!mod) {
      return NextResponse.json({ error: 'Módulo no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Módulo eliminado' });
  } catch {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
