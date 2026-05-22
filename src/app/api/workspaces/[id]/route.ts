import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import dbConnect from '@/lib/db/mongoose';
import { Workspace } from '@/lib/models/workspace';
import { User } from '@/lib/models/user';
import { ModuleSubscription } from '@/lib/models/module-subscription';
import { getApiAuth } from '@/lib/auth/api';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getApiAuth(_request);
  if (!auth || auth.role !== 'admin') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  await dbConnect();
  const { id } = await params;

  if (auth.workspaceId !== id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const workspace = await Workspace.findById(id).populate('owner', 'name email').lean();
  if (!workspace) {
    return NextResponse.json({ error: 'Workspace no encontrado' }, { status: 404 });
  }

  const users = await User.find({ workspace: id }).lean();
  const subscriptions = await ModuleSubscription.find({ workspace: id }).lean();

  return NextResponse.json({ workspace, users, subscriptions });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getApiAuth(request);
  if (!auth || auth.role !== 'admin') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  await dbConnect();
  const { id } = await params;

  if (auth.workspaceId !== id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const workspace = await Workspace.findById(id);
  if (!workspace) {
    return NextResponse.json({ error: 'Workspace no encontrado' }, { status: 404 });
  }

  const { name } = await request.json();

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return NextResponse.json(
      { error: 'El nombre es requerido' },
      { status: 400 }
    );
  }

  workspace.name = name.trim();
  await workspace.save();

  return NextResponse.json({ message: 'Nombre del workspace actualizado correctamente', workspace });
}
