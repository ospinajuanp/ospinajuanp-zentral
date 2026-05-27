'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useToastContext } from '@/contexts/toast-context';
import { usePaginatedData } from '@/hooks/use-paginated-data';
import { DataTable, type DataColumn } from '@/components/data-table';
import { ConfirmDialog } from '@/components/ui';

interface UserItem {
  _id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
}

export default function AdminUsersPage() {
  const toast = useToastContext();
  const {
    items: users,
    loading,
    page,
    limit,
    total,
    totalPages,
    changePage,
    changeLimit,
    refresh,
  } = usePaginatedData<UserItem>('/api/users');

  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/users/${deleteTarget.id}`, { method: 'DELETE' });
      if (res.ok) {
        setDeleteTarget(null);
        refresh();
      } else {
        const data = await res.json();
        toast.error(data.error ?? 'Error al eliminar');
      }
    } catch {
      toast.error('Error de conexion');
    } finally {
      setDeleting(false);
    }
  }

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
          {u.role === 'admin' ? 'Admin' : 'Usuario'}
        </span>
      ),
    },
    {
      header: 'Estado',
      render: (u) => (
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
            u.isActive
              ? 'bg-emerald-500/10 text-emerald-500'
              : 'bg-rose-500/10 text-rose-500'
          }`}
        >
          {u.isActive ? 'Activo' : 'Inactivo'}
        </span>
      ),
    },
  ];

  return (
    <>
      <DataTable
        columns={columns}
        data={users}
        keyField="_id"
        loading={loading}
        emptyMessage="No hay usuarios en este workspace."
        page={page}
        totalPages={totalPages}
        total={total}
        limit={limit}
        onPageChange={changePage}
        onLimitChange={changeLimit}
        title="Usuarios del workspace"
        titleCount={total}
        titleCountLabel={`usuario${total !== 1 ? 's' : ''} en total`}
        createHref="/users/create"
        createLabel="+ Nuevo usuario"
        actions={(u) => (
          <div className="flex items-center gap-3">
            <Link
              href={`/users/${u._id}`}
              className="text-sm font-medium text-indigo-400 underline underline-offset-2 hover:text-white"
            >
              Editar
            </Link>
            <button
              onClick={() => setDeleteTarget({ id: u._id, name: u.name })}
              className="text-sm font-medium text-rose-400 underline underline-offset-2 hover:text-rose-300"
            >
              Eliminar
            </button>
          </div>
        )}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Eliminar usuario"
        message="Estas seguro de eliminar a este usuario? Esta accion es irreversible."
        itemName={deleteTarget?.name ?? ''}
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}
