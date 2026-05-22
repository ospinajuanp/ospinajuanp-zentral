import Link from 'next/link';
import { notFound } from 'next/navigation';
import dbConnect from '@/lib/db/mongoose';
import { Workspace } from '@/lib/models/workspace';
import { User } from '@/lib/models/user';
import { ModuleSubscription } from '@/lib/models/module-subscription';

export default async function WorkspaceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  await dbConnect();

  const workspace = await Workspace.findById(id).populate('owner', 'name email');

  if (!workspace) {
    notFound();
  }

  const users = await User.find({ workspace: id });
  const subscriptions = await ModuleSubscription.find({ workspace: id });

  return (
    <div>
      <Link
        href="/admin/workspaces"
        className="text-sm text-zinc-500 hover:text-zinc-700"
      >
        ← Volver a Workspaces
      </Link>

      <h1 className="mt-4 text-2xl font-bold tracking-tight text-zinc-900">
        {workspace.name}
      </h1>
      <p className="mt-1 text-sm text-zinc-600">
        Slug: <span className="font-mono">{workspace.slug}</span> —{' '}
        {workspace.isActive ? 'Activo' : 'Inactivo'}
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-zinc-900">Usuarios ({users.length})</h2>
          <ul className="mt-4 space-y-3">
            {users.length === 0 ? (
              <p className="text-sm text-zinc-500">Sin usuarios.</p>
            ) : (
              users.map((u) => (
                <li key={u._id.toString()} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-zinc-900">{u.name}</p>
                    <p className="text-xs text-zinc-500">{u.email}</p>
                  </div>
                  <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600">
                    {u.role}
                  </span>
                </li>
              ))
            )}
          </ul>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-zinc-900">
            Módulos ({subscriptions.length})
          </h2>
          <ul className="mt-4 space-y-3">
            {subscriptions.length === 0 ? (
              <p className="text-sm text-zinc-500">Sin módulos activos.</p>
            ) : (
              subscriptions.map((sub) => (
                <li key={sub._id.toString()} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-zinc-900">{sub.moduleKey}</p>
                    <p className="text-xs text-zinc-500">
                      {sub.tier === 'free' ? 'Gratis' : 'Premium'} —{' '}
                      {sub.status === 'active' ? 'Activo' : sub.status}
                    </p>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
