'use client';

import Link from 'next/link';
import { usePaginatedData } from '@/hooks/use-paginated-data';
import { DataTable, type DataColumn } from '@/components/data-table';
import type { ModuleInfo } from '@/types';

export default function ModulesPage() {
  const {
    items: modules,
    loading,
    page,
    limit,
    total,
    totalPages,
    changePage,
    changeLimit,
  } = usePaginatedData<ModuleInfo>('/api/admin/modules');

  const columns: DataColumn<ModuleInfo>[] = [
    {
      header: 'Modulo',
      render: (mod) => (
        <>
          <span className="font-medium text-white">{mod.name}</span>
          {mod.description && (
            <span className="ml-2 text-xs text-slate-500">{mod.description}</span>
          )}
        </>
      ),
    },
    {
      header: 'Key',
      render: (mod) => <span className="font-mono text-slate-400">{mod.key}</span>,
    },
    {
      header: 'Tier',
      render: (mod) => (
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
            mod.tier === 'free' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-indigo-500/10 text-indigo-400'
          }`}
        >
          {mod.tier === 'free' ? 'Gratis' : 'Premium'}
        </span>
      ),
    },
    {
      header: 'Cuota',
      render: (mod) => <span className="text-slate-400">{mod.defaultQuota}/mes</span>,
    },
    {
      header: 'Estado',
      render: (mod) => (
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
            mod.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' :
            mod.status === 'coming_soon' ? 'bg-amber-500/10 text-amber-400' :
            'bg-rose-500/10 text-rose-500'
          }`}
        >
          {mod.status === 'active' ? 'Activo' : mod.status === 'coming_soon' ? 'Proximamente' : 'Inactivo'}
        </span>
      ),
    },
    {
      header: 'Visible',
      render: (mod) => (
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
            mod.visible ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-800 text-slate-500'
          }`}
        >
          {mod.visible ? 'Si' : 'No'}
        </span>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={modules}
      keyField="_id"
      loading={loading}
      emptyMessage="No hay modulos registrados."
      page={page}
      totalPages={totalPages}
      total={total}
      limit={limit}
      onPageChange={changePage}
      onLimitChange={changeLimit}
      title="Modulos"
      titleCount={total}
      titleCountLabel={`modulo${total !== 1 ? 's' : ''} registrado${total !== 1 ? 's' : ''}`}
      createHref="/admin/modules/create"
      createLabel="+ Nuevo modulo"
      actions={(mod) => (
        <Link
          href={`/admin/modules/${mod._id}`}
          className="text-sm font-medium text-indigo-400 underline underline-offset-2 hover:text-white"
        >
          Editar
        </Link>
      )}
    />
  );
}
