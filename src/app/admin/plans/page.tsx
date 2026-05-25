'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useToastContext } from '@/contexts/toast-context';
import { PaginationBar } from '@/components/pagination';

interface ModuleSummary {
  _id: string;
  key: string;
  name: string;
  defaultQuota: number;
  tier: string;
}

interface PlanIncludedModule {
  module: ModuleSummary;
  quotaOverride: number | null;
}

interface PlanItem {
  _id: string;
  name: string;
  price: string;
  description: string;
  includedModules: PlanIncludedModule[];
  maxUsers: number;
  extraFeatures: string[];
  highlighted: boolean;
  sortOrder: number;
  isActive: boolean;
}

export default function PlansPage() {
  const toast = useToastContext();
  const [plans, setPlans] = useState<PlanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  function load(p: number, l: number) {
    setLoading(true);
    fetch(`/api/admin/plans?page=${p}&limit=${l}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.items) {
          setPlans(data.items);
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
          <h1 className="text-2xl font-bold tracking-tight text-white">Planes</h1>
          <p className="mt-1 text-sm text-slate-400">
            {total} plan{total !== 1 ? 'es' : ''} registrado{total !== 1 ? 's' : ''}.
          </p>
        </div>
        <Link
          href="/admin/plans/create"
          className="w-fit rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          + Nuevo plan
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
                  <th className="px-6 py-3 font-medium text-slate-400">Plan</th>
                  <th className="px-6 py-3 font-medium text-slate-400">Precio</th>
                  <th className="px-6 py-3 font-medium text-slate-400">Modulos</th>
                  <th className="px-6 py-3 font-medium text-slate-400">Usuarios</th>
                  <th className="px-6 py-3 font-medium text-slate-400">Cuota</th>
                  <th className="px-6 py-3 font-medium text-slate-400">Estado</th>
                  <th className="px-6 py-3 font-medium text-slate-400">Accion</th>
                </tr>
              </thead>
              <tbody>
                {plans.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500">No hay planes registrados.</td>
                  </tr>
                ) : (
                  plans.map((plan) => {
                    const totalQuota = plan.includedModules.reduce(
                      (s, im) => s + (im.quotaOverride ?? im.module.defaultQuota), 0
                    );
                    return (
                      <tr key={plan._id} className="border-b border-slate-800 last:border-0">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-white">{plan.name}</span>
                            {plan.highlighted && (
                              <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs font-medium text-zinc-300">Destacado</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-slate-300">{plan.price || '—'}{plan.price && plan.price !== 'A medida' ? '/mes' : ''}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-slate-400">{plan.includedModules.length}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-slate-400">{plan.maxUsers === 0 ? 'Ilimitados' : plan.maxUsers}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-slate-400">{totalQuota}/mes</span>
                        </td>
                        <td className="px-6 py-4">
                          {plan.isActive ? (
                            <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-500">Activo</span>
                          ) : (
                            <span className="rounded-full bg-rose-500/10 px-2.5 py-0.5 text-xs font-medium text-rose-500">Inactivo</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <Link
                            href={`/admin/plans/${plan._id}`}
                            className="text-sm font-medium text-indigo-400 underline underline-offset-2 hover:text-white"
                          >
                            Editar
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* mobile cards */}
          <div className="mt-8 space-y-3 sm:hidden">
            {plans.length === 0 ? (
              <p className="py-12 text-center text-sm text-slate-500">No hay planes registrados.</p>
            ) : (
              plans.map((plan) => {
                const totalQuota = plan.includedModules.reduce(
                  (s, im) => s + (im.quotaOverride ?? im.module.defaultQuota), 0
                );
                return (
                  <div key={plan._id} className="rounded-md border border-slate-800 bg-slate-900 p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-white">{plan.name}</h3>
                        {plan.highlighted && (
                          <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs font-medium text-zinc-300">Destacado</span>
                        )}
                        {!plan.isActive && (
                          <span className="rounded-full bg-rose-500/10 px-2 py-0.5 text-xs font-medium text-rose-500">Inactivo</span>
                        )}
                      </div>
                      <Link
                        href={`/admin/plans/${plan._id}`}
                        className="text-xs font-medium text-indigo-400 underline underline-offset-2 hover:text-white"
                      >
                        Editar
                      </Link>
                    </div>
                    <p className="mt-1 text-xs text-slate-400">
                      {plan.price || 'Sin precio'}{plan.price && plan.price !== 'A medida' ? '/mes' : ''} — {plan.description}
                    </p>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-slate-500">Modulos</span>
                        <p className="mt-0.5 text-slate-400">{plan.includedModules.length}</p>
                      </div>
                      <div>
                        <span className="text-slate-500">Usuarios</span>
                        <p className="mt-0.5 text-slate-400">{plan.maxUsers === 0 ? 'Ilimitados' : plan.maxUsers}</p>
                      </div>
                      <div>
                        <span className="text-slate-500">Cuota</span>
                        <p className="mt-0.5 text-slate-400">{totalQuota}/mes</p>
                      </div>
                      <div>
                        <span className="text-slate-500">Orden</span>
                        <p className="mt-0.5 text-slate-400">#{plan.sortOrder}</p>
                      </div>
                    </div>
                    {plan.extraFeatures.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {plan.extraFeatures.map((f) => (
                          <span key={f} className="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-500">{f}</span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
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
