import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import dbConnect from '@/lib/db/mongoose';
import { User } from '@/lib/models/user';
import { Workspace } from '@/lib/models/workspace';
import { getApiAuth } from '@/lib/auth/api';
import { checkFeatureEnabled } from '@/lib/settings/guard';
import { hashPassword } from '@/lib/auth';
import { createAuditLog, calculateChanges } from '@/lib/audit';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getApiAuth(_request);
  if (!auth || auth.role !== 'superadmin') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const check = await checkFeatureEnabled(_request, 'usersEnabled');
  if (check) return check;

  await dbConnect();
  const { id } = await params;

  const user = await User.findById(id).lean();
  if (!user) {
    return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
  }

  return NextResponse.json({ user });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getApiAuth(request);
  if (!auth || auth.role !== 'superadmin') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const check = await checkFeatureEnabled(request, 'usersEnabled');
  if (check) return check;

  await dbConnect();
  const { id } = await params;

  const user = await User.findById(id);
  if (!user) {
    return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
  }

  const body = await request.json();
  const { name, email, role, isActive, workspace, password } = body;

  if (name !== undefined) user.name = name;
  if (email !== undefined) user.email = email?.toLowerCase?.() ?? email;
  if (role !== undefined) {
    if (!['superadmin', 'admin', 'operador', 'hijo'].includes(role)) {
      return NextResponse.json({ error: 'Rol inválido' }, { status: 400 });
    }
    user.role = role;
  }
  if (isActive !== undefined) user.isActive = isActive;
  if (workspace !== undefined) user.workspace = workspace || null;
  if (password) user.passwordHash = await hashPassword(password);

  await user.save();

  const changes = calculateChanges(
    { name: user.name, email: user.email, role: user.role, isActive: user.isActive, workspace: user.workspace } as Record<string, unknown>,
    { name: name ?? user.name, email: email ?? user.email, role: role ?? user.role, isActive: isActive ?? user.isActive, workspace: workspace ?? user.workspace } as Record<string, unknown>,
    ['name', 'email', 'role', 'isActive', 'workspace']
  );

  await createAuditLog({
    action: 'update',
    entity: 'User',
    entityId: id,
    userId: auth.userId,
    userEmail: auth.email,
    userRole: auth.role,
    workspaceId: null,
    changes,
    request,
  });

  return NextResponse.json({ message: 'Usuario actualizado correctamente', user });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getApiAuth(_request);
  if (!auth || auth.role !== 'superadmin') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const check = await checkFeatureEnabled(_request, 'usersEnabled');
  if (check) return check;

  await dbConnect();
  const { id } = await params;

  const workspaceCount = await Workspace.countDocuments({ owner: id });
  if (workspaceCount > 0) {
    await Workspace.updateMany({ owner: id }, { $set: { owner: null } });
  }

  const user = await User.findByIdAndDelete(id);
  if (!user) {
    return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
  }

  await createAuditLog({
    action: 'delete',
    entity: 'User',
    entityId: id,
    userId: auth.userId,
    userEmail: auth.email,
    userRole: auth.role,
    workspaceId: null,
    metadata: { deletedUserName: user.name, deletedUserEmail: user.email, deletedUserRole: user.role },
    request: _request,
  });

  return NextResponse.json({ message: 'Usuario eliminado correctamente' });
}
