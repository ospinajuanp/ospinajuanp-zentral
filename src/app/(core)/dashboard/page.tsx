import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSession } from '@/lib/auth';
import dbConnect from '@/lib/db/mongoose';
import { ModuleSubscription } from '@/lib/models/module-subscription';
import { Workspace } from '@/lib/models/workspace';
import { User } from '@/lib/models/user';
import { TransferCheckLog } from '@/lib/models/transfercheck-log';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  await dbConnect();

  if (session.role === 'superadmin') {
    return (
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Dashboard</h1>
        <p className="mt-2 text-slate-400">Bienvenido a tu panel de control.</p>
        <div className="mt-8 rounded-md border border-slate-800 bg-slate-900 p-8 text-center">
          <p className="text-slate-400">
            Eres SuperAdmin.{' '}
            <Link href="/admin" className="font-medium text-white underline underline-offset-2">
              Ir al panel de administracion
            </Link>
          </p>
        </div>
      </div>
    );
  }

  const workspaceId = session.workspaceId!;

  const [rawSubs, workspace, activeUsers, recentLogs] = await Promise.all([
    ModuleSubscription.find({ workspace: workspaceId, status: 'active' }).lean(),
    Workspace.findById(workspaceId).populate('plans', 'name monthlyPrice').lean(),
    User.countDocuments({ workspace: workspaceId, isActive: true }),
    TransferCheckLog.find({ workspace: workspaceId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('status photoData createdAt')
      .lean(),
  ]);

  // Aggregate subscriptions by moduleKey
  const aggregated = new Map<
    string,
    { moduleKey: string; monthlyQuota: number; usedQuota: number; tiers: string[] }
  >();

  for (const sub of rawSubs) {
    const existing = aggregated.get(sub.moduleKey);
    if (existing) {
      existing.monthlyQuota += sub.monthlyQuota;
      existing.usedQuota += sub.usedQuota;
      if (!existing.tiers.includes(sub.tier)) existing.tiers.push(sub.tier);
    } else {
      aggregated.set(sub.moduleKey, {
        moduleKey: sub.moduleKey,
        monthlyQuota: sub.monthlyQuota,
        usedQuota: sub.usedQuota,
        tiers: [sub.tier],
      });
    }
  }

  const subscriptions = [...aggregated.values()];

  // Overall stats
  const totalQuota = subscriptions.reduce((s, m) => s + m.monthlyQuota, 0);
  const totalUsed = subscriptions.reduce((s, m) => s + m.usedQuota, 0);
  const usagePercent = totalQuota > 0 ? Math.min(100, Math.round((totalUsed / totalQuota) * 100)) : 0;

  // Workspace info
  const wsName = workspace?.name ?? 'Workspace';
  const planNames = ((workspace?.plans as { name: string; monthlyPrice: number | null }[] | undefined) ?? [])
    .map((p: { name: string }) => p.name);
  const planLabel = planNames.length > 0 ? planNames.join(' + ') : 'Sin plan';

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">{wsName}</h1>
        <p className="mt-1 text-sm text-slate-400">{planLabel}</p>
      </div>

      {/* Summary stats */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-slate-800 bg-slate-900 p-5">
          <p className="text-xs font-medium text-slate-400">Consultas este mes</p>
          <p className="mt-1 text-2xl font-bold text-indigo-400">
            {totalUsed.toLocaleString()} <span className="text-base font-normal text-slate-500">/ {totalQuota.toLocaleString()}</span>
          </p>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-1.5 rounded-full bg-indigo-500 transition-all"
              style={{ width: `${usagePercent}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-slate-500">{usagePercent}% usado</p>
        </div>

        <div className="rounded-lg border border-slate-800 bg-slate-900 p-5">
          <p className="text-xs font-medium text-slate-400">Modulos activos</p>
          <p className="mt-1 text-2xl font-bold text-emerald-400">{subscriptions.length}</p>
          <p className="mt-1 text-xs text-slate-500">con cuota disponible</p>
        </div>

        <div className="rounded-lg border border-slate-800 bg-slate-900 p-5">
          <p className="text-xs font-medium text-slate-400">Usuarios activos</p>
          <p className="mt-1 text-2xl font-bold text-emerald-400">{activeUsers}</p>
          <p className="mt-1 text-xs text-slate-500">en este workspace</p>
        </div>
      </div>

      {/* Modules grid */}
      <section>
        <div className="mb-3 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-indigo-500" />
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Modulos</h2>
        </div>

        {subscriptions.length === 0 ? (
          <div className="rounded-md border border-slate-800 bg-slate-900 p-8 text-center">
            <p className="text-sm text-slate-500">No hay modulos activos en este workspace.</p>
            <Link
              href="/workspace/plan"
              className="mt-3 inline-block text-sm font-medium text-indigo-400 hover:text-indigo-300"
            >
              Adquirir un plan →
            </Link>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {subscriptions.map((sub) => {
              const tierLabel =
                sub.tiers.length === 1
                  ? sub.tiers[0] === 'free'
                    ? 'Gratis'
                    : sub.tiers[0] === 'enterprise'
                      ? 'Enterprise'
                      : 'Premium'
                  : sub.tiers
                      .map((t) => (t === 'free' ? 'Gratis' : t === 'enterprise' ? 'Enterprise' : 'Premium'))
                      .join(' + ');

              const modPercent =
                sub.monthlyQuota > 0
                  ? Math.min(100, Math.round((sub.usedQuota / sub.monthlyQuota) * 100))
                  : 0;

              const barColor =
                modPercent >= 90
                  ? 'bg-rose-500'
                  : modPercent >= 70
                    ? 'bg-amber-500'
                    : 'bg-indigo-500';

              return (
                <Link
                  key={sub.moduleKey}
                  href={`/${sub.moduleKey}`}
                  aria-label={`Ir al modulo ${sub.moduleKey}`}
                  className="flex flex-col rounded-lg border border-slate-800 bg-slate-900 p-5 transition-all duration-200 hover:border-slate-700 hover:shadow-indigo-500/5"
                >
                  <h3 className="text-lg font-semibold text-white capitalize">
                    {sub.moduleKey}
                  </h3>
                  <p className="mt-0.5 text-xs text-slate-400">{tierLabel}</p>
                  <div className="mt-auto pt-4">
                    <div className="flex items-baseline justify-between">
                      <p className="text-2xl font-bold text-white">
                        {sub.usedQuota.toLocaleString()}
                      </p>
                      <p className="text-xs text-slate-500">/ {sub.monthlyQuota.toLocaleString()}</p>
                    </div>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                      <div
                        className={`h-1.5 rounded-full ${barColor} transition-all`}
                        style={{ width: `${modPercent}%` }}
                      />
                    </div>
                    <p className="mt-1 text-right text-xs text-slate-500">{modPercent}%</p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* Recent TransferCheck activity */}
      {recentLogs.length > 0 && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-sky-500" />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
                Actividad reciente — TransferCheck
              </h2>
            </div>
            <Link
              href="/transfercheck"
              className="text-xs text-indigo-400 hover:text-indigo-300"
            >
              Ver todos →
            </Link>
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-900">
            <div className="divide-y divide-slate-800">
              {recentLogs.map((log: Record<string, unknown>) => {
                const photo = log.photoData as { monto: number; referencia: string; fecha: string } | undefined;
                const status = log.status as string;
                const createdAt = log.createdAt as Date | undefined;

                const statusBadge =
                  status === 'matched'
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : status === 'pending_email'
                      ? 'bg-amber-500/10 text-amber-400'
                      : 'bg-rose-500/10 text-rose-400';

                const statusLabel =
                  status === 'matched'
                    ? 'Conciliado'
                    : status === 'pending_email'
                      ? 'Pendiente'
                      : 'Error';

                const dateStr = createdAt
                  ? new Date(createdAt).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })
                  : '';

                return (
                  <Link
                    key={String(log._id)}
                    href="/transfercheck"
                    className="flex items-center justify-between px-5 py-3 transition-colors hover:bg-slate-950"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusBadge}`}>
                        {statusLabel}
                      </span>
                      <span className="text-sm text-slate-300">
                        {photo
                          ? `$${photo.monto.toLocaleString('es-CO')}`
                          : '—'}
                      </span>
                      {photo?.referencia && (
                        <span className="text-xs text-slate-500 font-mono">
                          REF {photo.referencia}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-500">{dateStr}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
