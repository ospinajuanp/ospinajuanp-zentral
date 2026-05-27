'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePaginatedData } from '@/hooks/use-paginated-data';
import { DataTable, type DataColumn } from '@/components/data-table';

interface UserItem {
  _id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  workspace?: string;
}

interface WorkspaceItem {
  _id: string;
  name: string;
}

export default function UsersPage() {
  const {
    items: users,
    loading,
    page,
    limit,
    total,
    totalPages,
    changePage,
    changeLimit,
  } = usePaginatedData<UserItem>('/api/admin/users');

  const [workspaces, setWorkspaces] = useState<WorkspaceItem[]>([]);

  useEffect(() => {
    fetch('/api/admin/workspaces?limit=100')
      .then((res) => res.json())
      .then((data) => {
        if (data.items) setWorkspaces(data.items);
      })
      .catch(() => {});
  }, []);

  const workspaceMap = new Map(workspaces.map((w) => [w._id, w.name]));

  const columns: DataColumn<UserItem>[] = [
    {
      header: 'Nombre',
      render: (u) => <span className="font-medium text-white">{u.name}</span>,
    },
    {
      header: 'Email',
      render: (u) => <span className="text-slate-400">{u.email}</span>,
    },
    {
      header: 'Rol',
      render: (u) => (
        <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-xs font-medium text-slate-400">
          {u.role}
        </span>
      ),
    },
    {
      header: 'Workspace',
      render: (u) => (
        <span className="text-slate-400">
          {u.workspace ? (workspaceMap.get(u.workspace.toString()) ?? '—') : '—'}
        </span>
      ),
    },
    {
      header: 'Estado',
      render: (u) => (
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
            u.isActive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
          }`}
        >
          {u.isActive ? 'Activo' : 'Inactivo'}
        </span>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={users}
      keyField="_id"
      loading={loading}
      emptyMessage="No hay usuarios registrados."
      page={page}
      totalPages={totalPages}
      total={total}
      limit={limit}
      onPageChange={changePage}
      onLimitChange={changeLimit}
      title="Usuarios"
      titleCount={total}
      titleCountLabel={`usuario${total !== 1 ? 's' : ''} registrado${total !== 1 ? 's' : ''}`}
      actions={(u) => (
        <Link
          href={`/admin/users/${u._id as string}`}
          className="text-sm font-medium text-indigo-400 underline underline-offset-2 hover:text-white"
        >
          Editar
        </Link>
      )}
    />
  );
}
