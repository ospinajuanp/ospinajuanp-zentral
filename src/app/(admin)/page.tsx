import { getSession } from '@/lib/auth';
import dbConnect from '@/lib/db/mongoose';
import { Workspace } from '@/lib/models/workspace';
import { User } from '@/lib/models/user';
import { ModuleSubscription } from '@/lib/models/module-subscription';

export default async function AdminDashboard() {
  const session = await getSession();

  await dbConnect();

  const totalWorkspaces = await Workspace.countDocuments();
  const activeWorkspaces = await Workspace.countDocuments({ isActive: true });
  const totalUsers = await User.countDocuments();
  const activeSubscriptions = await ModuleSubscription.countDocuments({ status: 'active' });

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
        Panel de Administración
      </h1>
      <p className="mt-1 text-sm text-zinc-600">
        Bienvenido, {session?.sub ? 'SuperAdmin' : ''}
      </p>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Workspaces totales" value={totalWorkspaces} />
        <StatCard label="Workspaces activos" value={activeWorkspaces} />
        <StatCard label="Usuarios registrados" value={totalUsers} />
        <StatCard label="Suscripciones activas" value={activeSubscriptions} />
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6">
      <p className="text-sm font-medium text-zinc-600">{label}</p>
      <p className="mt-2 text-3xl font-bold text-zinc-900">{value}</p>
    </div>
  );
}
