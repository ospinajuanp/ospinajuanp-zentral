'use client';

import Link from 'next/link';
import { usePaginatedData } from '@/hooks/use-paginated-data';
import { DataTable, type DataColumn } from '@/components/data-table';

interface ModuleSummary {
  _id: string;
  key: string;
  name: string;
  defaultQuota: number;
  tier: string;
}

interface PlanIncludedModule {
  module: ModuleSummary;
  quotaOverride: number | null;
}

interface PlanItem {
  _id: string;
  name: string;
  price: string;
  description: string;
  includedModules: PlanIncludedModule[];
  maxUsers: number;
  extraFeatures: string[];
  highlighted: boolean;
  sortOrder: number;
  isActive: boolean;
}

export default function PlansPage() {
  const {
    items: plans,
    loading,
    page,
    limit,
    total,
    totalPages,
    changePage,
    changeLimit,
  } = usePaginatedData<PlanItem>('/api/admin/plans');

  const columns: DataColumn<PlanItem>[] = [
    {
      header: 'Plan',
      render: (plan) => (
        <div className="flex items-center gap-2">
          <span className="font-medium text-white">{plan.name}</span>
          {plan.highlighted && (
            <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs font-medium text-zinc-300">
              Destacado
            </span>
          )}
        </div>
      ),
    },
    {
      header: 'Precio',
      render: (plan) => (
        <span className="text-slate-300">
          {plan.price || '—'}
          {plan.price && plan.price !== 'A medida' ? '/mes' : ''}
        </span>
      ),
    },
    {
      header: 'Modulos',
      render: (plan) => (
        <span className="text-slate-400">{plan.includedModules.length}</span>
      ),
    },
    {
      header: 'Usuarios',
      render: (plan) => (
        <span className="text-slate-400">
          {plan.maxUsers === 0 ? 'Ilimitados' : plan.maxUsers}
        </span>
      ),
    },
    {
      header: 'Cuota',
      render: (plan) => {
        const totalQuota = plan.includedModules.reduce(
          (s, im) => s + (im.quotaOverride ?? im.module.defaultQuota),
          0,
        );
        return <span className="text-slate-400">{totalQuota}/mes</span>;
      },
    },
    {
      header: 'Estado',
      render: (plan) =>
        plan.isActive ? (
          <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-500">
            Activo
          </span>
        ) : (
          <span className="rounded-full bg-rose-500/10 px-2.5 py-0.5 text-xs font-medium text-rose-500">
            Inactivo
          </span>
        ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={plans}
      keyField="_id"
      loading={loading}
      emptyMessage="No hay planes registrados."
      page={page}
      totalPages={totalPages}
      total={total}
      limit={limit}
      onPageChange={changePage}
      onLimitChange={changeLimit}
      title="Planes"
      titleCount={total}
      titleCountLabel={`plan${total !== 1 ? 'es' : ''} registrado${total !== 1 ? 's' : ''}`}
      createHref="/admin/plans/create"
      createLabel="+ Nuevo plan"
      actions={(plan) => (
        <Link
          href={`/admin/plans/${plan._id}`}
          className="text-sm font-medium text-indigo-400 underline underline-offset-2 hover:text-white"
        >
          Editar
        </Link>
      )}
    />
  );
}
