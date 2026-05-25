'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ErrorMessage } from '@/components/ui';
import type { ModuleInfo } from '@/types';

export default function ModulesPage() {
  const [modules, setModules] = useState<ModuleInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  function load() {
    setLoading(true);
    fetch('/api/admin/modules')
      .then((res) => res.json())
      .then((data) => {
        if (data.modules) setModules(data.modules);
      })
      .catch((err) => { console.error(err); setError('Error de conexión'); })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Módulos</h1>
          <p className="mt-1 text-sm text-slate-400">
            {modules.length} módulo{modules.length !== 1 ? 's' : ''} registrado{modules.length !== 1 ? 's' : ''}.
          </p>
        </div>
        <Link
          href="/admin/modules/create"
          className="w-fit rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          + Nuevo módulo
        </Link>
      </div>

      {error && <ErrorMessage message={error} />}

      {loading ? (
        <div className="mt-8 flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
        </div>
      ) : (
        <div className="mt-8 overflow-hidden rounded-md border border-slate-800 bg-slate-900 sm:overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="max-sm:hidden">
              <tr className="border-b border-slate-800 bg-slate-950 text-left">
                <th className="px-6 py-3 font-medium text-slate-400">Módulo</th>
                <th className="px-6 py-3 font-medium text-slate-400">Key</th>
                <th className="px-6 py-3 font-medium text-slate-400">Tier</th>
                <th className="px-6 py-3 font-medium text-slate-400">Cuota</th>
                <th className="px-6 py-3 font-medium text-slate-400">Estado</th>
                <th className="px-6 py-3 font-medium text-slate-400">Acción</th>
              </tr>
            </thead>
            <tbody>
              {modules.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    No hay módulos registrados.
                  </td>
                </tr>
              ) : (
                modules.map((mod) => (
                  <tr key={mod._id} className="block border-b border-slate-800 p-4 sm:table-row sm:border-none sm:p-0">
                    <td className="block sm:table-cell sm:px-6 sm:py-4">
                      <span className="block text-xs text-slate-500 max-sm:mb-0.5 sm:hidden">Módulo</span>
                      <span className="font-medium text-white">{mod.name}</span>
                      {mod.description && (
                        <span className="ml-2 text-xs text-slate-500 max-sm:hidden">{mod.description}</span>
                      )}
                    </td>
                    <td className="block sm:table-cell sm:px-6 sm:py-4">
                      <span className="block text-xs text-slate-500 max-sm:mb-0.5 sm:hidden">Key</span>
                      <span className="font-mono text-slate-400">{mod.key}</span>
                    </td>
                    <td className="block sm:table-cell sm:px-6 sm:py-4">
                      <span className="block text-xs text-slate-500 max-sm:mb-0.5 sm:hidden">Tier</span>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        mod.tier === 'free'
                          ? 'bg-emerald-500/10 text-emerald-500'
                          : 'bg-indigo-500/10 text-indigo-400'
                      }`}>
                        {mod.tier === 'free' ? 'Gratis' : 'Premium'}
                      </span>
                    </td>
                    <td className="block sm:table-cell sm:px-6 sm:py-4">
                      <span className="block text-xs text-slate-500 max-sm:mb-0.5 sm:hidden">Cuota</span>
                      <span className="text-slate-400">{mod.defaultQuota}/mes</span>
                    </td>
                    <td className="block sm:table-cell sm:px-6 sm:py-4">
                      <span className="block text-xs text-slate-500 max-sm:mb-0.5 sm:hidden">Estado</span>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        mod.status === 'active'
                          ? 'bg-emerald-500/10 text-emerald-500'
                          : mod.status === 'coming_soon'
                          ? 'bg-amber-500/10 text-amber-400'
                          : 'bg-rose-500/10 text-rose-500'
                      }`}>
                        {mod.status === 'active' ? 'Activo' : mod.status === 'coming_soon' ? 'Próximamente' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="block sm:table-cell sm:px-6 sm:py-4">
                      <span className="block text-xs text-slate-500 max-sm:mb-0.5 sm:hidden">Acción</span>
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
      )}
    </div>
  );
}
