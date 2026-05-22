import Link from 'next/link';
import { notFound } from 'next/navigation';
import dbConnect from '@/lib/db/mongoose';
import { User } from '@/lib/models/user';
import { Workspace } from '@/lib/models/workspace';

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  await dbConnect();

  const user = await User.findById(id);

  if (!user) {
    notFound();
  }

  let workspaceName = '—';
  if (user.workspace) {
    const ws = await Workspace.findById(user.workspace);
    if (ws) workspaceName = ws.name;
  }

  return (
    <div>
      <Link
        href="/admin/users"
        className="text-sm text-zinc-500 hover:text-zinc-700"
      >
        ← Volver a Usuarios
      </Link>

      <h1 className="mt-4 text-2xl font-bold tracking-tight text-zinc-900">
        {user.name}
      </h1>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-zinc-900">Información</h2>
          <dl className="mt-4 space-y-3">
            <div className="flex justify-between">
              <dt className="text-sm text-zinc-600">Email</dt>
              <dd className="text-sm font-medium text-zinc-900">{user.email}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-zinc-600">Rol</dt>
              <dd className="text-sm font-medium text-zinc-900">{user.role}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-zinc-600">Workspace</dt>
              <dd className="text-sm font-medium text-zinc-900">{workspaceName}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-zinc-600">Estado</dt>
              <dd>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    user.isActive
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-600'
                  }`}
                >
                  {user.isActive ? 'Activo' : 'Inactivo'}
                </span>
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
