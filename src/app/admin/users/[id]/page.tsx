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
        className="text-sm text-slate-400 hover:text-slate-300"
      >
        ← Volver a Usuarios
      </Link>

      <h1 className="mt-4 text-2xl font-bold tracking-tight text-white">
        {user.name}
      </h1>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-md border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-lg font-semibold text-white">Información</h2>
          <dl className="mt-4 space-y-3">
            <div className="flex justify-between">
              <dt className="text-sm text-slate-400">Email</dt>
              <dd className="text-sm font-medium text-white">{user.email}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-slate-400">Rol</dt>
              <dd className="text-sm font-medium text-white">{user.role}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-slate-400">Workspace</dt>
              <dd className="text-sm font-medium text-white">{workspaceName}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-slate-400">Estado</dt>
              <dd>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    user.isActive
                      ? 'bg-emerald-500/10 text-emerald-500'
                      : 'bg-rose-500/10 text-rose-500'
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
