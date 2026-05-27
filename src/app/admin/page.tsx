import { getSession } from '@/lib/auth';
import dbConnect from '@/lib/db/mongoose';
import { Module } from '@/lib/models/module';
import { Plan } from '@/lib/models/plan';
import { Workspace } from '@/lib/models/workspace';
import { User } from '@/lib/models/user';
import { ModuleSubscription } from '@/lib/models/module-subscription';
import Link from 'next/link';

export default async function AdminDashboard() {
  const _session = await getSession();
  void _session;

  await dbConnect();

  const [
    wTotal, wActive,
    mActive,
    uTotal, uActive,
    sActive, sPlan, sEnterprise,
    payReadyWorkspaces,
    allPlans,
  ] = await Promise.all([
    Workspace.countDocuments(),
    Workspace.countDocuments({ isActive: true }),
    Module.countDocuments({ status: 'active' }),
    User.countDocuments(),
    User.countDocuments({ isActive: true }),
    ModuleSubscription.countDocuments({ status: 'active' }),
    ModuleSubscription.countDocuments({ status: 'active', tier: { $ne: 'enterprise' } }),
    ModuleSubscription.countDocuments({ status: 'active', tier: 'enterprise' }),
    Workspace.find({ isActive: true, isPayReady: true }, 'plans').lean(),
    Plan.find({ isActive: true }, 'monthlyPrice').lean(),
  ]);

  const wPayReady = payReadyWorkspaces.length;
  const wPending = wActive - wPayReady;

  const paidPlanPrices = new Map(
    allPlans.filter((p) => p.monthlyPrice && p.monthlyPrice > 0).map((p) => [String(p._id), p.monthlyPrice])
  );

  let mrr = 0;
  for (const ws of payReadyWorkspaces) {
    if (!ws.plans || ws.plans.length === 0) continue;
    for (const planId of ws.plans) {
      const price = paidPlanPrices.get(String(planId));
      if (price) mrr += price;
    }
  }

  return (
    <div className="space-y-10">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Panel de Administracion</h1>
          <p className="mt-1 text-sm text-slate-400">Resumen general del sistema</p>
        </div>
        <p className="hidden text-xs text-slate-600 sm:block">
          {new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Facturacion — highlighted section */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Facturacion</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="MRR estimado"
            value={mrr}
            prefix="$"
            color="emerald"
            icon={<CurrencyIcon />}
          />
          <StatCard
            label="Pago confirmado"
            value={wPayReady}
            href="/admin/workspaces"
            color="emerald"
            icon={<CheckIcon />}
          />
          <StatCard
            label="Pago pendiente"
            value={wPending}
            href="/admin/workspaces"
            color="amber"
            icon={<ClockIcon />}
          />
          <StatCard
            label="Enterprise activas"
            value={sEnterprise}
            href="/admin/workspaces"
            color="indigo"
            subtitle="Suscripciones manuales"
            icon={<StarIcon />}
          />
        </div>
      </section>

      <div className="h-px bg-gradient-to-r from-transparent via-slate-800 to-transparent" />

      {/* Workspaces + Users */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-sky-500" />
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Workspaces y Usuarios</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Workspaces activos"
            value={wActive}
            href="/admin/workspaces"
            color="emerald"
            icon={<BuildingIcon />}
          />
          <StatCard
            label="Workspaces totales"
            value={wTotal}
            href="/admin/workspaces"
            icon={<LayersIcon />}
          />
          <StatCard
            label="Usuarios activos"
            value={uActive}
            href="/admin/users"
            color="emerald"
            icon={<UsersIcon />}
          />
          <StatCard
            label="Usuarios totales"
            value={uTotal}
            href="/admin/users"
            icon={<UsersIcon />}
          />
        </div>
      </section>

      <div className="h-px bg-gradient-to-r from-transparent via-slate-800 to-transparent" />

      {/* Modulos + Suscripciones */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-violet-500" />
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Modulos y Suscripciones</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Modulos activos"
            value={mActive}
            href="/admin/modules"
            color="emerald"
            icon={<CubeIcon />}
          />
          <StatCard
            label="Suscripciones activas"
            value={sActive}
            icon={<ZapIcon />}
          />
          <StatCard
            label="Suscripciones plan"
            value={sPlan}
            icon={<TagIcon />}
          />
          <StatCard
            label="Suscripciones enterprise"
            value={sEnterprise}
            href="/admin/workspaces"
            color="indigo"
            icon={<StarIcon />}
          />
        </div>
      </section>

      <div className="h-px bg-gradient-to-r from-transparent via-slate-800 to-transparent" />

      {/* Quick links */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-slate-600" />
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Accesos rapidos</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <QuickLink href="/admin/workspaces" label="Workspaces" icon={<BuildingIcon />} />
          <QuickLink href="/admin/modules" label="Modulos" icon={<CubeIcon />} />
          <QuickLink href="/admin/plans" label="Planes" icon={<TagIcon />} />
          <QuickLink href="/admin/users" label="Usuarios" icon={<UsersIcon />} />
          <QuickLink href="/admin/settings" label="Configuracion" icon={<GearIcon />} />
        </div>
      </section>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-up {
          animation: fadeUp 0.5s ease-out both;
        }
        .animate-fade-up:nth-child(1) { animation-delay: 0s; }
        .animate-fade-up:nth-child(2) { animation-delay: 0.07s; }
        .animate-fade-up:nth-child(3) { animation-delay: 0.14s; }
        .animate-fade-up:nth-child(4) { animation-delay: 0.21s; }
      `}</style>
    </div>
  );
}

function StatCard({
  label,
  value,
  href,
  prefix,
  color,
  subtitle,
  icon,
}: {
  label: string;
  value: number;
  href?: string;
  prefix?: string;
  subtitle?: string;
  color?: 'emerald' | 'rose' | 'amber' | 'indigo';
  icon?: React.ReactNode;
}) {
  const borderColor =
    color === 'emerald' ? 'border-l-emerald-500'
    : color === 'rose' ? 'border-l-rose-500'
    : color === 'amber' ? 'border-l-amber-500'
    : color === 'indigo' ? 'border-l-indigo-500'
    : 'border-l-slate-700';

  const colorClass =
    color === 'emerald' ? 'text-emerald-400'
    : color === 'rose' ? 'text-rose-400'
    : color === 'amber' ? 'text-amber-400'
    : color === 'indigo' ? 'text-indigo-400'
    : 'text-white';

  const inner = (
    <div className={`animate-fade-up flex h-full flex-col rounded-lg border border-slate-800 border-l-2 ${borderColor} bg-slate-900/80 p-5 backdrop-blur-sm transition-all duration-200 hover:border-slate-700 hover:bg-slate-900`}>
      <div className="mb-2 flex items-center gap-2">
        {icon && <span className="text-slate-500">{icon}</span>}
        <p className="text-xs font-medium text-slate-400">{label}</p>
      </div>
      <p className={`text-3xl font-bold tracking-tight ${colorClass}`}>
        {prefix ? `${prefix}${value.toLocaleString()}` : value.toLocaleString()}
      </p>
      {subtitle ? (
        <p className="mt-auto pt-2 text-xs text-slate-500">{subtitle}</p>
      ) : (
        <div className="mt-auto pt-2" />
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block h-full focus:outline-none focus:ring-2 focus:ring-indigo-500/50 rounded-lg">
        {inner}
      </Link>
    );
  }
  return inner;
}

function QuickLink({ href, label, icon }: { href: string; label: string; icon?: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="animate-fade-up flex h-full flex-col rounded-lg border border-slate-800 bg-slate-900/60 p-5 transition-all duration-200 hover:border-indigo-700 hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
    >
      <div className="mb-2 flex items-center gap-2">
        {icon && <span className="text-slate-500">{icon}</span>}
        <p className="text-sm font-medium text-white">{label}</p>
      </div>
      <p className="mt-auto text-xs text-slate-500">Gestionar &rarr;</p>
    </Link>
  );
}

/* ---- Icons ---- */

function CurrencyIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    </svg>
  );
}

function BuildingIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  );
}

function LayersIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
    </svg>
  );
}

function CubeIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  );
}

function ZapIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  );
}

function TagIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
    </svg>
  );
}

function GearIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}
