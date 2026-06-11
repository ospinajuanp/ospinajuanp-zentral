import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import dbConnect from '@/lib/db/mongoose';
import { Workspace } from '@/lib/models/workspace';
import { User } from '@/lib/models/user';
import { ModuleSubscription } from '@/lib/models/module-subscription';
import { Plan } from '@/lib/models/plan';
void Plan; // registered for populate('plans')
import { getApiAuth } from '@/lib/auth/api';
import { checkFeatureEnabled } from '@/lib/settings/guard';
import { createAuditLog, calculateChanges } from '@/lib/audit';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getApiAuth(_request);
  if (!auth || auth.role !== 'superadmin') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const check = await checkFeatureEnabled(_request, 'workspacesEnabled');
  if (check) return check;

  await dbConnect();
  const { id } = await params;

  const workspace = await Workspace.findById(id).populate('owner', 'name email').populate('plans', 'name price isEnterprise').lean();
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

  const check = await checkFeatureEnabled(request, 'workspacesEnabled');
  if (check) return check;

  await dbConnect();
  const { id } = await params;

  const workspace = await Workspace.findById(id);
  if (!workspace) {
    return NextResponse.json({ error: 'Workspace no encontrado' }, { status: 404 });
  }

  const body = await request.json();
  const { name, slug, owner, isActive, isPayReady } = body;

  if (name !== undefined) workspace.name = name;
  if (slug !== undefined) {
    const existingSlug = await Workspace.countDocuments({ slug, _id: { $ne: id } });
    if (existingSlug > 0) {
      return NextResponse.json(
        { error: 'Ya existe un workspace con ese slug.' },
        { status: 409 }
      );
    }
    workspace.slug = slug;
  }
  if (owner !== undefined) workspace.owner = owner || null;
  if (isActive !== undefined) workspace.isActive = isActive;

  const wasPayReady = workspace.isPayReady;
  if (isPayReady !== undefined) workspace.isPayReady = isPayReady;

  await workspace.save();

  const changes = calculateChanges(
    { name: workspace.name, slug: workspace.slug, isActive: workspace.isActive, isPayReady: wasPayReady } as Record<string, unknown>,
    { name: workspace.name, slug: workspace.slug, isActive: workspace.isActive, isPayReady: workspace.isPayReady } as Record<string, unknown>,
    ['name', 'slug', 'isActive', 'isPayReady']
  );

  await createAuditLog({
    action: 'update',
    entity: 'Workspace',
    entityId: id,
    userId: auth.userId,
    userEmail: auth.email,
    userRole: auth.role,
    workspaceId: null,
    changes,
    request,
  });

  if (!wasPayReady && workspace.isPayReady) {
    await ModuleSubscription.updateMany(
      { workspace: id, status: 'inactive' },
      { status: 'active' }
    );
  } else if (wasPayReady && !workspace.isPayReady) {
    await ModuleSubscription.updateMany(
      { workspace: id, status: 'active' },
      { status: 'inactive' }
    );
  }

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

  const check = await checkFeatureEnabled(_request, 'workspacesEnabled');
  if (check) return check;

  await dbConnect();
  const { id } = await params;

  const workspace = await Workspace.findByIdAndDelete(id);
  if (!workspace) {
    return NextResponse.json({ error: 'Workspace no encontrado' }, { status: 404 });
  }

  await User.updateMany({ workspace: id }, { workspace: null });
  await ModuleSubscription.deleteMany({ workspace: id });

  await createAuditLog({
    action: 'delete',
    entity: 'Workspace',
    entityId: id,
    userId: auth.userId,
    userEmail: auth.email,
    userRole: auth.role,
    workspaceId: null,
    metadata: { deletedWorkspaceName: workspace.name, deletedWorkspaceSlug: workspace.slug },
    request: _request,
  });

  return NextResponse.json({ message: 'Workspace eliminado correctamente' });
}
