import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSession } from '@/lib/auth';
import dbConnect from '@/lib/db/mongoose';
import { ModuleSubscription } from '@/lib/models/module-subscription';

export default async function DashboardPage() {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  await dbConnect();

  const subscriptions =
    session.role === 'superadmin'
      ? []
      : await ModuleSubscription.find({
          workspace: session.workspaceId,
          status: 'active',
        });

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-white">Dashboard</h1>
      <p className="mt-2 text-slate-400">Bienvenido a tu panel de control.</p>

      {session.role === 'superadmin' ? (
        <div className="mt-8 rounded-md border border-slate-800 bg-slate-900 p-8 text-center">
          <p className="text-slate-400">
            Eres SuperAdmin.{' '}
            <Link
              href="/admin"
              className="font-medium text-white underline underline-offset-2"
            >
              Ir al panel de administracion
            </Link>
          </p>
        </div>
      ) : (
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-white">Módulos activos</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {subscriptions.length === 0 ? (
              <p className="col-span-full text-sm text-slate-500">
                No hay módulos activos en este workspace.
              </p>
            ) : (
              subscriptions.map((sub) => (
                <Link
                  key={sub._id.toString()}
                  href={`/${sub.moduleKey}`}
                  aria-label={`Ir al modulo ${sub.moduleKey}`}
                  className="rounded-md border border-slate-800 bg-slate-900 p-6 transition-shadow hover:shadow-indigo-500/10"
                >
                  <h3 className="text-lg font-semibold text-white capitalize">
                    {sub.moduleKey}
                  </h3>
                  <p className="mt-1 text-sm text-slate-400">
                    {sub.tier === 'free' ? 'Gratis' : 'Premium'}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {sub.usedQuota} / {sub.monthlyQuota} consultas
                  </p>
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
