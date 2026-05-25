'use client';

import { useState, useEffect } from 'react';

interface PlanModule {
  _id: string;
  key: string;
  name: string;
  description: string;
  tier: string;
}

interface PlanData {
  _id: string;
  name: string;
  price: string;
  monthlyPrice: number | null;
  description: string;
  includedModules: { module: PlanModule; quotaOverride: number | null }[];
  maxUsers: number;
  extraFeatures: string[];
  support: string;
  onboarding: string;
  highlighted: boolean;
  isEnterprise: boolean;
}

interface PurchaseData {
  _id: string;
  planName: string;
  amount: number;
  currency: string;
  status: string;
  purchasedAt: string;
}

export default function WorkspacePlanPage() {
  const [session, setSession] = useState<{ role: string; workspaceId: string } | null>(null);
  const [plans, setPlans] = useState<PlanData[]>([]);
  const [currentPlanId, setCurrentPlanId] = useState<string | null>(null);
  const [purchases, setPurchases] = useState<PurchaseData[]>([]);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const sessionRes = await fetch('/api/auth/session');
        const sessionData = await sessionRes.json();
        setSession(sessionData);

        const [plansRes, wsRes, purchasesRes] = await Promise.all([
          fetch('/api/plans'),
          fetch(`/api/workspaces/${sessionData.workspaceId}`),
          fetch(`/api/workspaces/${sessionData.workspaceId}/purchases`),
        ]);

        const plansData = await plansRes.json();
        const wsData = await wsRes.json();
        const purchasesData = await purchasesRes.json();

        if (plansData.plans) setPlans(plansData.plans);
        if (wsData.workspace?.plans) setCurrentPlanId(wsData.workspace.plans[0]?._id || wsData.workspace.plans[0] || null);
        if (purchasesData.purchases) setPurchases(purchasesData.purchases);
      } catch {
        setError('No se pudo cargar la informacion de planes.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function handlePurchase(planId: string) {
    if (!session?.workspaceId) return;
    setBuying(planId);
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`/api/workspaces/${session.workspaceId}/purchase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Error al procesar la compra');
        return;
      }

      setCurrentPlanId(planId);
      setSuccess(`Plan "${data.purchase.planName}" activado correctamente.`);

      // Refresh purchases
      const purchasesRes = await fetch(`/api/workspaces/${session.workspaceId}/purchases`);
      const purchasesData = await purchasesRes.json();
      if (purchasesData.purchases) setPurchases(purchasesData.purchases);
    } catch {
      setError('No se pudo procesar la compra. Revisa tu conexion.');
    } finally {
      setBuying(null);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl">
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold tracking-tight text-white">Planes y precios</h1>
      <p className="mt-1 text-sm text-slate-400">
        Gestiona el plan de tu empresa. Los cambios se aplican de inmediato en este entorno de prueba.
      </p>

      {error && (
        <div className="mt-4 rounded-md border border-rose-800 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">
          {error}
        </div>
      )}

      {success && (
        <div className="mt-4 rounded-md border border-emerald-800 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
          {success}
        </div>
      )}

      {/* Plans grid */}
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => {
          const isCurrent = plan._id === currentPlanId;
          const isEnterprise = plan.isEnterprise;
          const priceText = isEnterprise
            ? 'A medida'
            : plan.monthlyPrice === 0 || !plan.monthlyPrice
              ? 'Gratis'
              : `$${plan.monthlyPrice.toLocaleString('es-CO')}/mes`;

          return (
            <div
              key={plan._id}
              className={`rounded-md border p-6 ${
                plan.highlighted
                  ? 'border-indigo-600 bg-indigo-950/20'
                  : isEnterprise
                    ? 'border-amber-700 border-dashed bg-amber-950/10'
                    : isCurrent
                      ? 'border-emerald-600 bg-emerald-950/10'
                      : 'border-slate-800 bg-slate-900'
              }`}
            >
              {plan.highlighted && (
                <span className="mb-2 inline-block rounded-full bg-indigo-600 px-2 py-0.5 text-xs font-medium text-white">
                  Mas popular
                </span>
              )}

              {isCurrent && (
                <span className="mb-2 inline-block rounded-full bg-emerald-600 px-2 py-0.5 text-xs font-medium text-white">
                  Plan actual
                </span>
              )}

              <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
              <p className="mt-1 text-2xl font-bold text-white">{priceText}</p>
              <p className="mt-2 text-xs text-slate-400">{plan.description}</p>

              <ul className="mt-4 space-y-1.5">
                {plan.includedModules?.map((pm) => (
                  <li key={pm.module._id} className="flex items-center gap-2 text-xs text-slate-400">
                    <span className="text-emerald-500">+</span>
                    {pm.module.name}
                  </li>
                ))}
                {plan.extraFeatures?.map((feat) => (
                  <li key={feat} className="flex items-center gap-2 text-xs text-slate-400">
                    <span className="text-emerald-500">+</span>
                    {feat}
                  </li>
                ))}
              </ul>

              <p className="mt-3 text-xs text-slate-500">
                {plan.maxUsers === 0 ? 'Usuarios ilimitados' : `Hasta ${plan.maxUsers} usuario${plan.maxUsers !== 1 ? 's' : ''}`}
              </p>

              <button
                onClick={() => handlePurchase(plan._id)}
                disabled={buying === plan._id || isCurrent}
                className={`mt-4 w-full rounded-md px-4 py-2.5 text-sm font-medium transition-colors ${
                  isCurrent
                    ? 'bg-slate-800 text-slate-500 cursor-default'
                    : isEnterprise
                      ? 'bg-amber-600 text-white hover:bg-amber-700'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                } disabled:opacity-50`}
              >
                {isCurrent
                  ? 'Plan actual'
                  : buying === plan._id
                    ? 'Activando...'
                    : isEnterprise
                      ? 'Contactar'
                      : `Cambiar a ${plan.name}`}
              </button>
            </div>
          );
        })}
      </div>

      {/* Purchase history */}
      {purchases.length > 0 && (
        <div className="mt-12">
          <h2 className="text-lg font-semibold text-white">Historial de compras</h2>
          <div className="mt-4 overflow-hidden rounded-md border border-slate-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-left text-xs uppercase text-slate-500">
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Plan</th>
                  <th className="px-4 py-3">Monto</th>
                  <th className="px-4 py-3">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {purchases.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-900/50">
                    <td className="px-4 py-3 text-slate-300">
                      {new Date(p.purchasedAt).toLocaleDateString('es-CO', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-4 py-3 font-medium text-white">{p.planName}</td>
                    <td className="px-4 py-3 text-slate-300">
                      {p.amount.toLocaleString('es-CO')} {p.currency}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
                        Completado
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
