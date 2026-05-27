'use client';

import Link from 'next/link';
import { usePaginatedData } from '@/hooks/use-paginated-data';
import { DataTable, type DataColumn } from '@/components/data-table';

interface WorkspaceItem {
  _id: string;
  name: string;
  slug: string;
  isActive: boolean;
  owner?: { _id: string; name: string; email: string } | null;
}

export default function WorkspacesPage() {
  const {
    items: workspaces,
    loading,
    page,
    limit,
    total,
    totalPages,
    changePage,
    changeLimit,
  } = usePaginatedData<WorkspaceItem>('/api/admin/workspaces');

  const columns: DataColumn<WorkspaceItem>[] = [
    {
      header: 'Nombre',
      render: (ws) => <span className="font-medium text-white">{ws.name}</span>,
    },
    {
      header: 'Slug',
      render: (ws) => <span className="font-mono text-slate-400">{ws.slug}</span>,
    },
    {
      header: 'Admin',
      render: (ws) => <span className="text-slate-400">{ws.owner?.name ?? '—'}</span>,
    },
    {
      header: 'Estado',
      render: (ws) => (
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
            ws.isActive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
          }`}
        >
          {ws.isActive ? 'Activo' : 'Inactivo'}
        </span>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={workspaces}
      keyField="_id"
      loading={loading}
      emptyMessage="No hay workspaces registrados."
      page={page}
      totalPages={totalPages}
      total={total}
      limit={limit}
      onPageChange={changePage}
      onLimitChange={changeLimit}
      title="Workspaces"
      titleCount={total}
      titleCountLabel={`workspace${total !== 1 ? 's' : ''} registrado${total !== 1 ? 's' : ''}`}
      createHref="/admin/workspaces/create"
      createLabel="+ Nuevo workspace"
      actions={(ws) => (
        <Link
          href={`/admin/workspaces/${ws._id}`}
          className="text-sm font-medium text-indigo-400 underline underline-offset-2 hover:text-white"
        >
          Editar
        </Link>
      )}
    />
  );
}
