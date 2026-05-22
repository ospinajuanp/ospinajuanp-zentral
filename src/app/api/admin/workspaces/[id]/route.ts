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
  if (!auth || auth.role !== 'superadmin') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  await dbConnect();
  const { id } = await params;

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
  if (!auth || auth.role !== 'superadmin') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  await dbConnect();
  const { id } = await params;

  const workspace = await Workspace.findById(id);
  if (!workspace) {
    return NextResponse.json({ error: 'Workspace no encontrado' }, { status: 404 });
  }

  const body = await request.json();
  const { name, slug, owner, isActive } = body;

  if (name !== undefined) workspace.name = name;
  if (slug !== undefined) workspace.slug = slug;
  if (owner !== undefined) workspace.owner = owner || null;
  if (isActive !== undefined) workspace.isActive = isActive;

  await workspace.save();

  return NextResponse.json({ message: 'Workspace actualizado correctamente', workspace });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getApiAuth(_request);
  if (!auth || auth.role !== 'superadmin') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  await dbConnect();
  const { id } = await params;

  const workspace = await Workspace.findByIdAndDelete(id);
  if (!workspace) {
    return NextResponse.json({ error: 'Workspace no encontrado' }, { status: 404 });
  }

  await User.updateMany({ workspace: id }, { workspace: null });
  await ModuleSubscription.deleteMany({ workspace: id });

  return NextResponse.json({ message: 'Workspace eliminado correctamente' });
}
