'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ConfirmDialog, ErrorMessage } from '@/components/ui';
import { PaginationBar } from '@/components/pagination';

interface UserItem {
  _id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  function loadUsers(p: number, l: number) {
    setLoading(true);
    fetch(`/api/users?page=${p}&limit=${l}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.items) {
          setUsers(data.items);
          setTotal(data.total);
          setPage(data.page);
          setTotalPages(data.totalPages);
        }
      })
      .catch((err) => { console.error(err); setError('Error de conexion'); })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadUsers(page, limit);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/users/${deleteTarget.id}`, { method: 'DELETE' });
      if (res.ok) {
        setDeleteTarget(null);
        loadUsers(page, limit);
      } else {
        const data = await res.json();
        setError(data.error ?? 'Error al eliminar');
      }
    } catch {
      setError('Error de conexion');
    } finally {
      setDeleting(false);
    }
  }

  function changePage(p: number) {
    setPage(p);
    loadUsers(p, limit);
  }

  function changeLimit(l: number) {
    setLimit(l);
    setPage(1);
    loadUsers(1, l);
  }

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Usuarios del workspace</h1>
          <p className="mt-1 text-sm text-slate-400">
            {total} usuario{total !== 1 ? 's' : ''} en total.
          </p>
        </div>
        <Link
          href="/users/create"
          className="w-fit rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          + Nuevo usuario
        </Link>
      </div>

      {error && <ErrorMessage message={error} />}

      {loading ? (
        <div className="mt-8 flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
        </div>
      ) : (
        <>
          <div className="mt-8 overflow-hidden rounded-md border border-slate-800 bg-slate-900 sm:overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="max-sm:hidden">
                <tr className="border-b border-slate-800 bg-slate-950 text-left">
                  <th className="px-6 py-3 font-medium text-slate-400">Nombre</th>
                  <th className="px-6 py-3 font-medium text-slate-400">Email</th>
                  <th className="px-6 py-3 font-medium text-slate-400">Rol</th>
                  <th className="px-6 py-3 font-medium text-slate-400">Estado</th>
                  <th className="px-6 py-3 font-medium text-slate-400">Accion</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                      No hay usuarios en este workspace.
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u._id} className="block border-b border-slate-800 p-4 sm:table-row sm:border-none sm:p-0">
                      <td className="block sm:table-cell sm:px-6 sm:py-4">
                        <span className="block text-xs text-slate-500 max-sm:mb-0.5 sm:hidden">Nombre</span>
                        <span className="font-medium text-white">{u.name}</span>
                      </td>
                      <td className="block sm:table-cell sm:px-6 sm:py-4">
                        <span className="block text-xs text-slate-500 max-sm:mb-0.5 sm:hidden">Email</span>
                        <span className="text-slate-400">{u.email}</span>
                      </td>
                      <td className="block sm:table-cell sm:px-6 sm:py-4">
                        <span className="block text-xs text-slate-500 max-sm:mb-0.5 sm:hidden">Rol</span>
                        <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-xs font-medium text-slate-400">
                          {u.role === 'admin' ? 'Admin' : 'Usuario'}
                        </span>
                      </td>
                      <td className="block sm:table-cell sm:px-6 sm:py-4">
                        <span className="block text-xs text-slate-500 max-sm:mb-0.5 sm:hidden">Estado</span>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            u.isActive
                              ? 'bg-emerald-500/10 text-emerald-500'
                              : 'bg-rose-500/10 text-rose-500'
                          }`}
                        >
                          {u.isActive ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="block sm:table-cell sm:px-6 sm:py-4">
                        <span className="block text-xs text-slate-500 max-sm:mb-0.5 sm:hidden">Accion</span>
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
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <PaginationBar
            page={page}
            totalPages={totalPages}
            total={total}
            limit={limit}
            onPageChange={changePage}
            onLimitChange={changeLimit}
          />
        </>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Eliminar usuario"
        message="Estas seguro de eliminar a este usuario? Esta accion es irreversible."
        itemName={deleteTarget?.name ?? ''}
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
