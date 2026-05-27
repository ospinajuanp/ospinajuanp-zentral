import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import dbConnect from '@/lib/db/mongoose';
import { Workspace } from '@/lib/models/workspace';
import { getApiAuth } from '@/lib/auth/api';
import { checkFeatureEnabled } from '@/lib/settings/guard';

export async function GET(request: NextRequest) {
  const auth = await getApiAuth(request);
  if (!auth || auth.role !== 'superadmin') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const check = await checkFeatureEnabled(request, 'workspacesEnabled');
  if (check) return check;

  await dbConnect();

  const { searchParams } = new URL(request.url);
  const isActive = searchParams.get('isActive');
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const limit = Math.min(100, Math.max(5, parseInt(searchParams.get('limit') || '10')));

  const filter: Record<string, unknown> = {};
  if (isActive === 'true') filter.isActive = true;
  if (isActive === 'false') filter.isActive = false;

  const [workspaces, total] = await Promise.all([
    Workspace.find(filter)
      .sort({ createdAt: -1 })
      .populate('owner', 'name email')
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Workspace.countDocuments(filter),
  ]);

  return NextResponse.json({
    items: workspaces,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
}

export async function POST(request: NextRequest) {
  const auth = await getApiAuth(request);
  if (!auth || auth.role !== 'superadmin') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const check = await checkFeatureEnabled(request, 'workspacesEnabled');
  if (check) return check;

  const { name, slug, owner, isActive } = await request.json();

  if (!name || !slug) {
    return NextResponse.json(
      { error: 'Nombre y slug son requeridos' },
      { status: 400 }
    );
  }

  await dbConnect();

  const existing = await Workspace.findOne({ slug: slug.toLowerCase() });
  if (existing) {
    return NextResponse.json(
      { error: 'Ya existe un workspace con este slug' },
      { status: 409 }
    );
  }

  const workspace = await Workspace.create({
    name,
    slug: slug.toLowerCase(),
    owner: owner || null,
    isActive: isActive !== undefined ? isActive : true,
  });

  return NextResponse.json(
    { message: 'Workspace creado correctamente', workspace },
    { status: 201 }
  );
}
