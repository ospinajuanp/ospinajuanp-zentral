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

  // Workspace stats
  const wTotal = allWorkspaces.length;
  const wActive = allWorkspaces.filter((w) => w.isActive).length;
  const wInactive = allWorkspaces.filter((w) => !w.isActive).length;
  const wPending = allWorkspaces.filter((w) => !w.isPayReady).length;
  const wPayReady = allWorkspaces.filter((w) => w.isPayReady).length;

  // Module stats
  const mTotal = allModules.length;
  const mActive = allModules.filter((m) => m.status === 'active').length;
  const mFree = allModules.filter((m) => m.tier === 'free').length;
  const mPremium = allModules.filter((m) => m.tier === 'premium').length;

  // Plan stats
  const pTotal = allPlans.length;
  const pActive = allPlans.filter((p) => p.isActive).length;
  const pEnterprise = allPlans.filter((p) => p.isEnterprise).length;

  // User stats
  const uTotal = allUsers.length;
  const uActive = allUsers.filter((u) => u.isActive).length;
  const uPendingVerification = allUsers.filter((u) => !u.isActive).length;
  const uAdmins = allUsers.filter((u) => u.role === 'admin').length;

  // Subscription & billing
  const sTotal = allSubscriptions.length;
  const sActive = allSubscriptions.filter((s) => s.status === 'active').length;
  const sPremium = allSubscriptions.filter((s) => s.tier === 'premium').length;

  let mrr = 0;
  for (const ws of allWorkspaces) {
    if (!ws.isActive || !ws.isPayReady) continue;
    if (!ws.plan) continue;
    const plan = allPlans.find((p) => String(p._id) === String(ws.plan));
    if (plan && plan.monthlyPrice) mrr += plan.monthlyPrice;
  }

  const paidPlanIds = new Set(allPlans.filter((p) => p.monthlyPrice && p.monthlyPrice > 0).map((p) => String(p._id)));
  const wPaid = allWorkspaces.filter((w) => w.plan && paidPlanIds.has(String(w.plan))).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Panel de Administración</h1>
        <p className="mt-1 text-sm text-slate-400">Bienvenido, {session?.sub ? 'SuperAdmin' : ''}</p>
      </div>

      {/* Billing / MRR — top priority */}
      <section>
        <h2 className="mb-3 text-lg font-semibold text-white">Facturación</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="MRR (USD)" value={mrr} prefix="$" color="emerald" />
          <StatCard label="Pago confirmado" value={wPayReady} color="emerald" />
          <StatCard label="Pago pendiente" value={wPending} color="amber" />
          <StatCard label="Planes de pago activos" value={wPaid} color="indigo" />
        </div>
      </section>

      {/* Workspaces */}
      <Section title="Workspaces" href="/admin/workspaces">
        <StatCard label="Total" value={wTotal} href="/admin/workspaces" />
        <StatCard label="Activos" value={wActive} href="/admin/workspaces" color="emerald" />
        <StatCard label="Inactivos" value={wInactive} href="/admin/workspaces" color="rose" />
        <StatCard label="Suscripciones activas" value={sActive} />
      </Section>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Modules */}
        <Section title="Módulos" href="/admin/modules">
          <StatCard label="Total" value={mTotal} href="/admin/modules" />
          <StatCard label="Activos" value={mActive} href="/admin/modules" color="emerald" />
          <StatCard label="Gratis" value={mFree} href="/admin/modules" />
          <StatCard label="Premium" value={mPremium} href="/admin/modules" color="indigo" />
        </Section>

        {/* Users */}
        <Section title="Usuarios" href="/admin/users">
          <StatCard label="Total" value={uTotal} href="/admin/users" />
          <StatCard label="Activos" value={uActive} href="/admin/users" color="emerald" />
          <StatCard label="Pend. verificación" value={uPendingVerification} href="/admin/users" color="amber" />
          <StatCard label="Admins" value={uAdmins} href="/admin/users?role=admin" />
        </Section>
      </div>

      {/* Plans */}
      <Section title="Planes" href="/admin/plans">
        <StatCard label="Total" value={pTotal} href="/admin/plans" />
        <StatCard label="Activos" value={pActive} href="/admin/plans" color="emerald" />
        <StatCard label="Enterprise" value={pEnterprise} href="/admin/plans" color="amber" />
        <StatCard label="Suscripciones totales" value={sTotal} />
      </Section>
    </div>
  );
}

function Section({
  title,
  href,
  children,
}: {
  title: string;
  href?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-3 flex items-center gap-2">
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        {href && (
          <Link href={href} className="text-xs text-indigo-400 hover:text-indigo-300">
            Ver todos →
          </Link>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {children}
      </div>
    </section>
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
  const colorClass =
    color === 'emerald' ? 'text-emerald-400'
    : color === 'rose' ? 'text-rose-400'
    : color === 'amber' ? 'text-amber-400'
    : color === 'indigo' ? 'text-indigo-400'
    : 'text-white';

  const inner = (
    <div className="rounded-md border border-slate-800 bg-slate-900 p-4 transition-colors hover:border-slate-700">
      <p className="text-xs font-medium text-slate-400">{label}</p>
      <p className={`mt-1.5 text-2xl font-bold ${colorClass}`}>
        {prefix ? `${prefix}${value.toLocaleString()}` : value.toLocaleString()}
      </p>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {inner}
      </Link>
    );
  }
  return inner;
}
