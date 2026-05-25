'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useToastContext } from '@/contexts/toast-context';
import { PaginationBar } from '@/components/pagination';
import type { ModuleInfo } from '@/types';

export default function ModulesPage() {
  const toast = useToastContext();
  const [modules, setModules] = useState<ModuleInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  function load(p: number, l: number) {
    setLoading(true);
    fetch(`/api/admin/modules?page=${p}&limit=${l}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.items) {
          setModules(data.items);
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
          <h1 className="text-2xl font-bold tracking-tight text-white">Modulos</h1>
          <p className="mt-1 text-sm text-slate-400">
            {total} modulo{total !== 1 ? 's' : ''} registrado{total !== 1 ? 's' : ''}.
          </p>
        </div>
        <Link
          href="/admin/modules/create"
          className="w-fit rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          + Nuevo modulo
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
                  <th className="px-6 py-3 font-medium text-slate-400">Modulo</th>
                  <th className="px-6 py-3 font-medium text-slate-400">Key</th>
                  <th className="px-6 py-3 font-medium text-slate-400">Tier</th>
                  <th className="px-6 py-3 font-medium text-slate-400">Cuota</th>
                  <th className="px-6 py-3 font-medium text-slate-400">Estado</th>
                  <th className="px-6 py-3 font-medium text-slate-400">Accion</th>
                </tr>
              </thead>
              <tbody>
                {modules.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">No hay modulos registrados.</td>
                  </tr>
                ) : (
                  modules.map((mod) => (
                    <tr key={mod._id} className="border-b border-slate-800 last:border-0">
                      <td className="px-6 py-4">
                        <span className="font-medium text-white">{mod.name}</span>
                        {mod.description && (
                          <span className="ml-2 text-xs text-slate-500">{mod.description}</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-slate-400">{mod.key}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          mod.tier === 'free' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-indigo-500/10 text-indigo-400'
                        }`}>
                          {mod.tier === 'free' ? 'Gratis' : 'Premium'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-slate-400">{mod.defaultQuota}/mes</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          mod.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' :
                          mod.status === 'coming_soon' ? 'bg-amber-500/10 text-amber-400' :
                          'bg-rose-500/10 text-rose-500'
                        }`}>
                          {mod.status === 'active' ? 'Activo' : mod.status === 'coming_soon' ? 'Proximamente' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <Link
                          href={`/admin/modules/${mod._id}`}
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
            {modules.length === 0 ? (
              <p className="py-12 text-center text-sm text-slate-500">No hay modulos registrados.</p>
            ) : (
              modules.map((mod) => (
                <div key={mod._id} className="rounded-md border border-slate-800 bg-slate-900 p-4 pb-5">
                  <div className="flex items-start justify-between">
                    <h3 className="font-medium text-white">{mod.name}</h3>
                    <Link
                      href={`/admin/modules/${mod._id}`}
                      className="text-xs font-medium text-indigo-400 underline underline-offset-2 hover:text-white"
                    >
                      Editar
                    </Link>
                  </div>
                  {mod.description && <p className="mt-1 text-xs text-slate-500">{mod.description}</p>}
                  <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-500">Key</span>
                      <p className="mt-1 font-mono text-slate-400">{mod.key}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Cuota</span>
                      <p className="mt-1 text-slate-400">{mod.defaultQuota}/mes</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Tier</span>
                      <p className="mt-1">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          mod.tier === 'free' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-indigo-500/10 text-indigo-400'
                        }`}>
                          {mod.tier === 'free' ? 'Gratis' : 'Premium'}
                        </span>
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-500">Estado</span>
                      <p className="mt-1">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          mod.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' :
                          mod.status === 'coming_soon' ? 'bg-amber-500/10 text-amber-400' :
                          'bg-rose-500/10 text-rose-500'
                        }`}>
                          {mod.status === 'active' ? 'Activo' : mod.status === 'coming_soon' ? 'Proximamente' : 'Inactivo'}
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
