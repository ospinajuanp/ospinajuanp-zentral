'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useToastContext } from '@/contexts/toast-context';
import { PaginationBar } from '@/components/pagination';

interface WorkspaceItem {
  _id: string;
  name: string;
  slug: string;
  isActive: boolean;
  owner?: { _id: string; name: string; email: string } | null;
}

export default function WorkspacesPage() {
  const toast = useToastContext();
  const [workspaces, setWorkspaces] = useState<WorkspaceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  function load(p: number, l: number) {
    setLoading(true);
    fetch(`/api/admin/workspaces?page=${p}&limit=${l}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.items) {
          setWorkspaces(data.items);
          setTotal(data.total);
          setPage(data.page);
          setTotalPages(data.totalPages);
        }
      })
      .catch((err) => { console.error(err); toast.error('Error de conexion'); })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load(page, limit);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function changePage(p: number) {
    setPage(p);
    load(p, limit);
  }

  function changeLimit(l: number) {
    setLimit(l);
    setPage(1);
    load(1, l);
  }

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Workspaces</h1>
          <p className="mt-1 text-sm text-slate-400">
            {total} workspace{total !== 1 ? 's' : ''} registrado{total !== 1 ? 's' : ''}.
          </p>
        </div>
        <Link
          href="/admin/workspaces/create"
          className="w-fit rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          + Nuevo workspace
        </Link>
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
                  <th className="px-6 py-3 font-medium text-slate-400">Slug</th>
                  <th className="px-6 py-3 font-medium text-slate-400">Admin</th>
                  <th className="px-6 py-3 font-medium text-slate-400">Estado</th>
                  <th className="px-6 py-3 font-medium text-slate-400">Accion</th>
                </tr>
              </thead>
              <tbody>
                {workspaces.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">No hay workspaces registrados.</td>
                  </tr>
                ) : (
                  workspaces.map((ws) => (
                    <tr key={ws._id} className="border-b border-slate-800 last:border-0">
                      <td className="px-6 py-4">
                        <span className="font-medium text-white">{ws.name}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-slate-400">{ws.slug}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-slate-400">{ws.owner?.name ?? '—'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          ws.isActive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
                        }`}>
                          {ws.isActive ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <Link
                          href={`/admin/workspaces/${ws._id}`}
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
            {workspaces.length === 0 ? (
              <p className="py-12 text-center text-sm text-slate-500">No hay workspaces registrados.</p>
            ) : (
              workspaces.map((ws) => (
                <div key={ws._id} className="rounded-md border border-slate-800 bg-slate-900 p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-white">{ws.name}</h3>
                      <p className="mt-0.5 font-mono text-xs text-slate-400">{ws.slug}</p>
                    </div>
                    <Link
                      href={`/admin/workspaces/${ws._id}`}
                      className="text-xs font-medium text-indigo-400 underline underline-offset-2 hover:text-white"
                    >
                      Editar
                    </Link>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-500">Admin</span>
                      <p className="mt-0.5 text-slate-400">{ws.owner?.name ?? '—'}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Estado</span>
                      <p className="mt-0.5">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          ws.isActive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
                        }`}>
                          {ws.isActive ? 'Activo' : 'Inactivo'}
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
