'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface WorkspaceItem {
  _id: string;
  name: string;
  slug: string;
  isActive: boolean;
  owner?: { _id: string; name: string; email: string } | null;
}

export default function WorkspacesPage() {
  const [workspaces, setWorkspaces] = useState<WorkspaceItem[]>([]);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    fetch('/api/admin/workspaces')
      .then((res) => res.json())
      .then((data) => {
        if (data.workspaces) setWorkspaces(data.workspaces);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Workspaces</h1>
          <p className="mt-1 text-sm text-slate-400">
            {workspaces.length} workspace{workspaces.length !== 1 ? 's' : ''} registrado
            {workspaces.length !== 1 ? 's' : ''}.
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
        <div className="mt-8 overflow-hidden rounded-md border border-slate-800 bg-slate-900 sm:overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="max-sm:hidden">
              <tr className="border-b border-slate-800 bg-slate-950 text-left">
                <th className="px-6 py-3 font-medium text-slate-400">Nombre</th>
                <th className="px-6 py-3 font-medium text-slate-400">Slug</th>
                <th className="px-6 py-3 font-medium text-slate-400">Admin</th>
                <th className="px-6 py-3 font-medium text-slate-400">Estado</th>
                <th className="px-6 py-3 font-medium text-slate-400">Acción</th>
              </tr>
            </thead>
            <tbody>
              {workspaces.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    No hay workspaces registrados.
                  </td>
                </tr>
              ) : (
                workspaces.map((ws) => (
                  <tr key={ws._id} className="block border-b border-slate-800 p-4 sm:table-row sm:border-none sm:p-0">
                    <td className="block sm:table-cell sm:px-6 sm:py-4">
                      <span className="block text-xs text-slate-500 max-sm:mb-0.5 sm:hidden">Nombre</span>
                      <span className="font-medium text-white">{ws.name}</span>
                    </td>
                    <td className="block sm:table-cell sm:px-6 sm:py-4">
                      <span className="block text-xs text-slate-500 max-sm:mb-0.5 sm:hidden">Slug</span>
                      <span className="font-mono text-slate-400">{ws.slug}</span>
                    </td>
                    <td className="block sm:table-cell sm:px-6 sm:py-4">
                      <span className="block text-xs text-slate-500 max-sm:mb-0.5 sm:hidden">Admin</span>
                      <span className="text-slate-400">{ws.owner?.name ?? '—'}</span>
                    </td>
                    <td className="block sm:table-cell sm:px-6 sm:py-4">
                      <span className="block text-xs text-slate-500 max-sm:mb-0.5 sm:hidden">Estado</span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          ws.isActive
                            ? 'bg-emerald-500/10 text-emerald-500'
                            : 'bg-rose-500/10 text-rose-500'
                        }`}
                      >
                        {ws.isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="block sm:table-cell sm:px-6 sm:py-4">
                      <span className="block text-xs text-slate-500 max-sm:mb-0.5 sm:hidden">Acción</span>
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
      )}
    </div>
  );
}
