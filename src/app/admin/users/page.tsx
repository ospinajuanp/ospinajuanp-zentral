'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { PaginationBar } from '@/components/pagination';

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
  const [users, setUsers] = useState<UserItem[]>([]);
  const [workspaces, setWorkspaces] = useState<WorkspaceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  function loadUsers(p: number, l: number) {
    setLoading(true);
    fetch(`/api/admin/users?page=${p}&limit=${l}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.items) {
          setUsers(data.items);
          setTotal(data.total);
          setPage(data.page);
          setTotalPages(data.totalPages);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadUsers(page, limit);
    fetch('/api/admin/workspaces?limit=100')
      .then((res) => res.json())
      .then((data) => {
        if (data.items) setWorkspaces(data.items);
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function changePage(p: number) {
    setPage(p);
    loadUsers(p, limit);
  }

  function changeLimit(l: number) {
    setLimit(l);
    setPage(1);
    loadUsers(1, l);
  }

  const workspaceMap = new Map(workspaces.map((w) => [w._id, w.name]));

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Usuarios</h1>
          <p className="mt-1 text-sm text-slate-400">
            {total} usuario{total !== 1 ? 's' : ''} registrado{total !== 1 ? 's' : ''}.
          </p>
        </div>
        <button
          disabled
          title="La creacion de usuarios desde aqui no esta disponible temporalmente."
          className="w-fit cursor-not-allowed rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-slate-500"
        >
          + Crear usuario
        </button>
      </div>

      {loading ? (
        <div className="mt-8 flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
        </div>
      ) : (
        <>
          {/* desktop table */}
          <div className="mt-8 hidden overflow-hidden rounded-md border border-slate-800 bg-slate-900 sm:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950 text-left">
                  <th className="px-6 py-3 font-medium text-slate-400">Nombre</th>
                  <th className="px-6 py-3 font-medium text-slate-400">Email</th>
                  <th className="px-6 py-3 font-medium text-slate-400">Rol</th>
                  <th className="px-6 py-3 font-medium text-slate-400">Workspace</th>
                  <th className="px-6 py-3 font-medium text-slate-400">Estado</th>
                  <th className="px-6 py-3 font-medium text-slate-400">Accion</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">No hay usuarios registrados.</td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u._id} className="border-b border-slate-800 last:border-0">
                      <td className="px-6 py-4">
                        <span className="font-medium text-white">{u.name}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-slate-400">{u.email}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-xs font-medium text-slate-400">
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-slate-400">
                          {u.workspace ? workspaceMap.get(u.workspace.toString()) ?? '—' : '—'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          u.isActive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
                        }`}>
                          {u.isActive ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <Link
                          href={`/admin/users/${u._id.toString()}`}
                          className="text-sm font-medium text-indigo-400 underline underline-offset-2 hover:text-white"
                        >
                          Editar
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* mobile cards */}
          <div className="mt-8 space-y-3 sm:hidden">
            {users.length === 0 ? (
              <p className="py-12 text-center text-sm text-slate-500">No hay usuarios registrados.</p>
            ) : (
              users.map((u) => (
                <div key={u._id} className="rounded-md border border-slate-800 bg-slate-900 p-4 pb-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-white">{u.name}</h3>
                      <p className="mt-1 text-xs text-slate-400">{u.email}</p>
                    </div>
                    <Link
                      href={`/admin/users/${u._id.toString()}`}
                      className="text-xs font-medium text-indigo-400 underline underline-offset-2 hover:text-white"
                    >
                      Editar
                    </Link>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-500">Rol</span>
                      <p className="mt-1">
                        <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs font-medium text-slate-400">{u.role}</span>
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-500">Workspace</span>
                      <p className="mt-1 text-slate-400">
                        {u.workspace ? workspaceMap.get(u.workspace.toString()) ?? '—' : '—'}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-500">Estado</span>
                      <p className="mt-1">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          u.isActive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
                        }`}>
                          {u.isActive ? 'Activo' : 'Inactivo'}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
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
    </div>
  );
}
