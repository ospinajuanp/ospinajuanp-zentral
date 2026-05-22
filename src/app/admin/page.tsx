import { getSession } from '@/lib/auth';
import dbConnect from '@/lib/db/mongoose';
import { Module } from '@/lib/models/module';
import { Plan } from '@/lib/models/plan';
import { Workspace } from '@/lib/models/workspace';
import { User } from '@/lib/models/user';
import { ModuleSubscription } from '@/lib/models/module-subscription';
import Link from 'next/link';

export default async function AdminDashboard() {
  const session = await getSession();

  await dbConnect();

  const [allModules, allPlans, allWorkspaces, allUsers, allSubscriptions] = await Promise.all([
    Module.find().lean(),
    Plan.find().lean(),
    Workspace.find().lean(),
    User.find().lean(),
    ModuleSubscription.find().lean(),
  ]);

  // Module stats
  const mTotal = allModules.length;
  const mActive = allModules.filter((m) => m.status === 'active').length;
  const mInactive = allModules.filter((m) => m.status === 'inactive').length;
  const mComingSoon = allModules.filter((m) => m.status === 'coming_soon').length;
  const mFree = allModules.filter((m) => m.tier === 'free').length;
  const mPremium = allModules.filter((m) => m.tier === 'premium').length;

  // Plan stats
  const pTotal = allPlans.length;
  const pActive = allPlans.filter((p) => p.isActive).length;
  const pEnterprise = allPlans.filter((p) => p.isEnterprise).length;
  const pHighlighted = allPlans.filter((p) => p.highlighted).length;

  // Workspace stats
  const wTotal = allWorkspaces.length;
  const wActive = allWorkspaces.filter((w) => w.isActive).length;
  const wInactive = allWorkspaces.filter((w) => !w.isActive).length;
  const wPayReady = allWorkspaces.filter((w) => w.isPayReady).length;
  const wPending = allWorkspaces.filter((w) => !w.isPayReady).length;

  // User stats
  const uTotal = allUsers.length;
  const uActive = allUsers.filter((u) => u.isActive).length;
  const uInactive = allUsers.filter((u) => !u.isActive).length;
  const uSuperadmins = allUsers.filter((u) => u.role === 'superadmin').length;
  const uAdmins = allUsers.filter((u) => u.role === 'admin').length;
  const uHijos = allUsers.filter((u) => u.role === 'hijo').length;

  // Subscription stats
  const sTotal = allSubscriptions.length;
  const sActive = allSubscriptions.filter((s) => s.status === 'active').length;
  const sInactive = allSubscriptions.filter((s) => s.status === 'inactive').length;
  const sFree = allSubscriptions.filter((s) => s.tier === 'free').length;
  const sPremium = allSubscriptions.filter((s) => s.tier === 'premium').length;

  // Billing
  const paidPlanIds = new Set(allPlans.filter((p) => p.monthlyPrice && p.monthlyPrice > 0).map((p) => String(p._id)));
  const wPaid = allWorkspaces.filter((w) => w.plan && paidPlanIds.has(String(w.plan))).length;

  let mrr = 0;
  for (const ws of allWorkspaces) {
    if (!ws.isActive || !ws.isPayReady) continue;
    if (!ws.plan) continue;
    const plan = allPlans.find((p) => String(p._id) === String(ws.plan));
    if (plan && plan.monthlyPrice) mrr += plan.monthlyPrice;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Panel de Administración</h1>
        <p className="mt-1 text-sm text-slate-400">Bienvenido, {session?.sub ? 'SuperAdmin' : ''}</p>
      </div>

      {/* Workspaces */}
      <section>
        <div className="mb-3 flex items-center gap-2">
          <h2 className="text-lg font-semibold text-white">Workspaces</h2>
          <Link href="/admin/workspaces" className="text-xs text-indigo-400 hover:text-indigo-300">Ver todos →</Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard label="Total" value={wTotal} href="/admin/workspaces" />
          <StatCard label="Activos" value={wActive} href="/admin/workspaces?filter=active" color="emerald" />
          <StatCard label="Inactivos" value={wInactive} href="/admin/workspaces?filter=inactive" color="rose" />
          <StatCard label="Pago confirmado" value={wPayReady} href="/admin/workspaces?filter=payready" color="emerald" />
          <StatCard label="Pago pendiente" value={wPending} href="/admin/workspaces?filter=pending" color="amber" />
        </div>
      </section>

      {/* Modules */}
      <section>
        <div className="mb-3 flex items-center gap-2">
          <h2 className="text-lg font-semibold text-white">Módulos</h2>
          <Link href="/admin/modules" className="text-xs text-indigo-400 hover:text-indigo-300">Ver todos →</Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
          <StatCard label="Total" value={mTotal} href="/admin/modules" />
          <StatCard label="Activos" value={mActive} href="/admin/modules?filter=active" color="emerald" />
          <StatCard label="Inactivos" value={mInactive} href="/admin/modules?filter=inactive" color="rose" />
          <StatCard label="Coming soon" value={mComingSoon} href="/admin/modules?filter=coming_soon" color="amber" />
          <StatCard label="Gratis" value={mFree} href="/admin/modules?filter=free" />
          <StatCard label="Premium" value={mPremium} href="/admin/modules?filter=premium" color="indigo" />
        </div>
      </section>

      {/* Plans */}
      <section>
        <div className="mb-3 flex items-center gap-2">
          <h2 className="text-lg font-semibold text-white">Planes</h2>
          <Link href="/admin/plans" className="text-xs text-indigo-400 hover:text-indigo-300">Ver todos →</Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total" value={pTotal} href="/admin/plans" />
          <StatCard label="Activos" value={pActive} href="/admin/plans" color="emerald" />
          <StatCard label="Enterprise" value={pEnterprise} href="/admin/plans?filter=enterprise" color="amber" />
          <StatCard label="Destacados" value={pHighlighted} href="/admin/plans" color="indigo" />
        </div>
      </section>

      {/* Users */}
      <section>
        <div className="mb-3 flex items-center gap-2">
          <h2 className="text-lg font-semibold text-white">Usuarios</h2>
          <Link href="/admin/users" className="text-xs text-indigo-400 hover:text-indigo-300">Ver todos →</Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
          <StatCard label="Total" value={uTotal} href="/admin/users" />
          <StatCard label="Activos" value={uActive} href="/admin/users?filter=active" color="emerald" />
          <StatCard label="Inactivos" value={uInactive} href="/admin/users?filter=inactive" color="rose" />
          <StatCard label="Superadmins" value={uSuperadmins} href="/admin/users?filter=superadmin" color="amber" />
          <StatCard label="Admins" value={uAdmins} href="/admin/users?filter=admin" />
          <StatCard label="Hijos" value={uHijos} href="/admin/users?filter=hijo" />
        </div>
      </section>

      {/* Subscriptions */}
      <section>
        <div className="mb-3 flex items-center gap-2">
          <h2 className="text-lg font-semibold text-white">Suscripciones</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard label="Total" value={sTotal} />
          <StatCard label="Activas" value={sActive} color="emerald" />
          <StatCard label="Inactivas" value={sInactive} color="rose" />
          <StatCard label="Tier Gratis" value={sFree} />
          <StatCard label="Tier Premium" value={sPremium} color="indigo" />
        </div>
      </section>

      {/* Billing */}
      <section>
        <div className="mb-3 flex items-center gap-2">
          <h2 className="text-lg font-semibold text-white">Facturación</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard label="MRR (USD)" value={mrr} prefix="$" color="emerald" />
          <StatCard label="Workspaces con plan de pago" value={wPaid} />
          <StatCard label="Suscripciones premium" value={sPremium} color="indigo" />
        </div>
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  href,
  prefix,
  color,
}: {
  label: string;
  value: number;
  href?: string;
  prefix?: string;
  color?: 'default' | 'emerald' | 'rose' | 'amber' | 'indigo';
}) {
  const colorClass = color === 'emerald' ? 'text-emerald-400'
    : color === 'rose' ? 'text-rose-400'
    : color === 'amber' ? 'text-amber-400'
    : color === 'indigo' ? 'text-indigo-400'
    : 'text-white';

  const inner = (
    <div className="rounded-md border border-slate-800 bg-slate-900 p-5 transition-colors hover:border-slate-700">
      <p className="text-sm font-medium text-slate-400">{label}</p>
      <p className={`mt-2 text-3xl font-bold ${colorClass}`}>
        {prefix ? `${prefix}${value.toLocaleString()}` : value.toLocaleString()}
      </p>
    </div>
  );

  if (href) {
    return <Link href={href} className="block">{inner}</Link>;
  }
  return inner;
}