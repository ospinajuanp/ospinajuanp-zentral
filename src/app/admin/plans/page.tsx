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
          <div className="mt-8 space-y-4">
            {plans.length === 0 ? (
              <p className="py-12 text-center text-sm text-slate-500">No hay planes registrados.</p>
            ) : (
              plans.map((plan) => {
                const totalQuota = plan.includedModules.reduce(
                  (s, im) => s + (im.quotaOverride ?? im.module.defaultQuota), 0
                );
                return (
                  <Link
                    key={plan._id}
                    href={`/admin/plans/${plan._id}`}
                    className={`block rounded-md border p-5 transition-colors hover:border-indigo-700 ${
                      plan.highlighted ? 'border-zinc-700 bg-zinc-900' : 'border-slate-800 bg-slate-900'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
                          {plan.highlighted && (
                            <span className="rounded-full bg-zinc-800 px-2.5 py-0.5 text-xs font-medium text-zinc-300">
                              Destacado
                            </span>
                          )}
                          {!plan.isActive && (
                            <span className="rounded-full bg-rose-500/10 px-2.5 py-0.5 text-xs font-medium text-rose-500">
                              Inactivo
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-slate-400">
                          {plan.price}{plan.price !== 'A medida' ? '/mes' : ''} — {plan.description}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-400">
                            {plan.maxUsers === 0 ? 'Ilimitados' : `${plan.maxUsers} usuario${plan.maxUsers !== 1 ? 's' : ''}`}
                          </span>
                          <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-400">
                            {plan.includedModules.length} modulo{plan.includedModules.length !== 1 ? 's' : ''}
                          </span>
                          <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-400">
                            {totalQuota} consultas/mes
                          </span>
                          {plan.extraFeatures.slice(0, 3).map((f) => (
                            <span key={f} className="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-400">
                              {f}
                            </span>
                          ))}
                          {plan.extraFeatures.length > 3 && (
                            <span className="text-xs text-slate-500">+{plan.extraFeatures.length - 3} mas</span>
                          )}
                        </div>
                      </div>
                      <span className="text-sm text-slate-500">#{plan.sortOrder}</span>
                    </div>
                  </Link>
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
