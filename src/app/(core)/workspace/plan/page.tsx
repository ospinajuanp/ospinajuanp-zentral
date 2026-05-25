'use client';

import { useState, useEffect } from 'react';
import { PaginationBar } from '@/components/pagination';

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
  ctaLink: string;
}

interface PurchaseData {
  _id: string;
  plan: string;
  planName: string;
  amount: number;
  currency: string;
  status: string;
  purchasedAt: string;
  expiresAt: string;
  modules: { moduleKey: string; quota: number; tier: string }[];
}

type PaymentStep = 'idle' | 'gateway' | 'processing' | 'success' | 'rejected';

interface PaymentForm {
  nombre: string;
  apellido: string;
  telefono: string;
  tarjeta: string;
  expiracion: string;
  cvv: string;
}

const DEFAULT_PAYMENT: PaymentForm = {
  nombre: 'Usuario',
  apellido: 'Demo',
  telefono: '3001234567',
  tarjeta: '4242 4242 4242 4242',
  expiracion: '12/28',
  cvv: '123',
};

export default function WorkspacePlanPage() {
  const [session, setSession] = useState<{ role: string; workspaceId: string } | null>(null);
  const [plans, setPlans] = useState<PlanData[]>([]);
  const [currentPlanId, setCurrentPlanId] = useState<string | null>(null);
  const [purchases, setPurchases] = useState<PurchaseData[]>([]);
  const [purchPage, setPurchPage] = useState(1);
  const [purchLimit, setPurchLimit] = useState(10);
  const [purchTotal, setPurchTotal] = useState(0);
  const [purchTotalPages, setPurchTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Payment gateway state
  const [step, setStep] = useState<PaymentStep>('idle');
  const [selectedPlan, setSelectedPlan] = useState<PlanData | null>(null);
  const [form, setForm] = useState<PaymentForm>(DEFAULT_PAYMENT);

  const [toggling, setToggling] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const sessionRes = await fetch('/api/auth/session');
        const sessionData = await sessionRes.json();
        setSession(sessionData);

        const [plansRes, wsRes, purchasesRes] = await Promise.all([
          fetch('/api/plans'),
          fetch(`/api/workspaces/${sessionData.workspaceId}`),
          fetch(`/api/workspaces/${sessionData.workspaceId}/purchases?page=1&limit=10`),
        ]);

        const plansData = await plansRes.json();
        const wsData = await wsRes.json();
        const purchasesData = await purchasesRes.json();

        if (plansData.plans) setPlans(plansData.plans);
        if (wsData.workspace?.plans) setCurrentPlanId(wsData.workspace.plans[0]?._id || wsData.workspace.plans[0] || null);
        if (purchasesData.items) {
          setPurchases(purchasesData.items);
          setPurchTotal(purchasesData.total);
          setPurchPage(purchasesData.page);
          setPurchTotalPages(purchasesData.totalPages);
        }
      } catch {
        setError('No se pudo cargar la informacion de planes.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function loadPurchases(p: number, l: number) {
    if (!session?.workspaceId) return;
    const res = await fetch(`/api/workspaces/${session.workspaceId}/purchases?page=${p}&limit=${l}`);
    const data = await res.json();
    if (data.items) {
      setPurchases(data.items);
      setPurchTotal(data.total);
      setPurchPage(data.page);
      setPurchTotalPages(data.totalPages);
    }
  }

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

      await loadPurchases(purchPage, purchLimit);
    } catch {
      setError('No se pudo procesar la compra. Revisa tu conexion.');
    } finally {
      setBuying(null);
    }
  }

  function openGateway(plan: PlanData) {
    setSelectedPlan(plan);
    setForm(DEFAULT_PAYMENT);
    setStep('gateway');
    setError('');
    setSuccess('');
  }

  function closeGateway() {
    setStep('idle');
    setSelectedPlan(null);
  }

  async function handleToggle(purchaseId: string, newStatus: 'active' | 'cancelled') {
    if (!session?.workspaceId) return;
    setToggling(purchaseId);
    setError('');

    try {
      const res = await fetch(
        `/api/workspaces/${session.workspaceId}/purchases/${purchaseId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Error al actualizar el estado');
        return;
      }

      await loadPurchases(purchPage, purchLimit);
    } catch {
      setError('No se pudo actualizar el estado.');
    } finally {
      setToggling(null);
    }
  }

  async function processPayment() {
    if (!selectedPlan) return;
    setStep('processing');

    // Simulate payment processing delay
    await new Promise((r) => setTimeout(r, 2000));

    await handlePurchase(selectedPlan._id);
    setStep('success');
    setTimeout(() => closeGateway(), 2500);
  }

  // Only show paid non-enterprise plans
  const visiblePlans = plans.filter((p) => !p.isEnterprise && (p.monthlyPrice ?? 0) > 0);

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
        Adquiere planes para tu empresa. El plan Free ya esta incluido en tu workspace.
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
      {visiblePlans.length === 0 ? (
        <div className="mt-12 rounded-md border border-slate-800 bg-slate-900 p-8 text-center">
          <p className="text-slate-400">No hay planes disponibles para compra en este momento.</p>
        </div>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {visiblePlans.map((plan) => {
            const isCurrent = plan._id === currentPlanId;

            return (
              <div
                key={plan._id}
                className={`flex flex-col h-full rounded-md border p-6 ${
                  plan.highlighted
                    ? 'border-indigo-600 bg-indigo-950/20'
                    : isCurrent
                      ? 'border-emerald-600 bg-emerald-950/10'
                      : 'border-slate-800 bg-slate-900'
                }`}
              >
                {plan.highlighted && (
                  <span className="mb-2 inline-block self-start rounded-full bg-indigo-600 px-2 py-0.5 text-xs font-medium text-white">
                    Mas popular
                  </span>
                )}

                {isCurrent && (
                  <span className="mb-2 inline-block self-start rounded-full bg-emerald-600 px-2 py-0.5 text-xs font-medium text-white">
                    Contratado
                  </span>
                )}

                <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
                <p className="mt-1 text-2xl font-bold text-white">
                  ${plan.monthlyPrice!.toLocaleString('es-CO')}/mes
                </p>
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

                <div className="mt-auto pt-4">
                  <p className="text-xs text-slate-500">
                    {plan.maxUsers === 0 ? 'Usuarios ilimitados' : `Hasta ${plan.maxUsers} usuario${plan.maxUsers !== 1 ? 's' : ''}`}
                  </p>

                  <button
                    onClick={() => openGateway(plan)}
                    disabled={buying === plan._id}
                    className={`mt-3 w-full rounded-md px-4 py-2.5 text-sm font-medium transition-colors ${
                      isCurrent
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                    } disabled:opacity-50`}
                  >
                    {buying === plan._id ? 'Procesando...' : isCurrent ? 'Comprar mas cuota' : `Comprar ${plan.name}`}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Payment gateway modal */}
      {step !== 'idle' && selectedPlan && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          role="button"
          tabIndex={0}
          aria-label="Cerrar modal de pago"
          onClick={closeGateway}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') closeGateway();
          }}
        >
          <div
            className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-900 shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === 'Escape') closeGateway();
              e.stopPropagation();
            }}
          >
            {/* Simulated banner */}
            <div className="rounded-t-xl border-b border-slate-700 bg-amber-500/10 px-4 py-2 text-center">
              <span className="text-xs font-medium text-amber-400">
                SIMULADO — No se realizaran cobros reales
              </span>
            </div>

            {step === 'gateway' && (
              <>
                <div className="p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 id="modal-title" className="text-lg font-semibold text-white">
                      Pasarela de pago
                    </h2>
                    <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-xs text-slate-400">
                      {selectedPlan.name}
                    </span>
                  </div>

                  <div className="mb-4 rounded-md border border-slate-800 bg-slate-950 p-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Total a pagar</span>
                      <span className="font-bold text-white">
                        ${selectedPlan.monthlyPrice!.toLocaleString('es-CO')} COP
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label htmlFor="nombre" className="block text-xs text-slate-500 mb-1">
                          Nombre
                        </label>
                        <input
                          id="nombre"
                          type="text"
                          value={form.nombre}
                          onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                          autoComplete="given-name"
                          className="w-full rounded border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label htmlFor="apellido" className="block text-xs text-slate-500 mb-1">
                          Apellido
                        </label>
                        <input
                          id="apellido"
                          type="text"
                          value={form.apellido}
                          onChange={(e) => setForm({ ...form, apellido: e.target.value })}
                          autoComplete="family-name"
                          className="w-full rounded border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="telefono" className="block text-xs text-slate-500 mb-1">
                        Telefono
                      </label>
                      <input
                        id="telefono"
                        type="text"
                        inputMode="numeric"
                        value={form.telefono}
                        onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                        autoComplete="tel"
                        className="w-full rounded border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label htmlFor="tarjeta" className="block text-xs text-slate-500 mb-1">
                        Numero de tarjeta
                      </label>
                      <div className="relative">
                        <input
                          id="tarjeta"
                          type="text"
                          inputMode="numeric"
                          value={form.tarjeta}
                          onChange={(e) => setForm({ ...form, tarjeta: e.target.value })}
                          maxLength={19}
                          autoComplete="cc-number"
                          className="w-full rounded border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">
                          VISA ***
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label htmlFor="expiracion" className="block text-xs text-slate-500 mb-1">
                          Fecha de expiracion
                        </label>
                        <input
                          id="expiracion"
                          type="text"
                          value={form.expiracion}
                          onChange={(e) => setForm({ ...form, expiracion: e.target.value })}
                          placeholder="MM/AA"
                          maxLength={5}
                          autoComplete="cc-exp"
                          className="w-full rounded border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label htmlFor="cvv" className="block text-xs text-slate-500 mb-1">
                          Codigo de seguridad
                        </label>
                        <input
                          id="cvv"
                          type="text"
                          inputMode="numeric"
                          value={form.cvv}
                          onChange={(e) => setForm({ ...form, cvv: e.target.value })}
                          maxLength={4}
                          autoComplete="cc-csc"
                          className="w-full rounded border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 border-t border-slate-800 px-6 py-4">
                  <button
                    type="button"
                    onClick={closeGateway}
                    className="flex-1 rounded-md border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-800 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={processPayment}
                    className="flex-1 rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
                  >
                    Pagar ${selectedPlan.monthlyPrice!.toLocaleString('es-CO')}
                  </button>
                </div>
              </>
            )}

            {step === 'processing' && (
              <div className="flex flex-col items-center py-12" role="status" aria-label="Procesando pago">
                <div className="h-10 w-10 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
                <p className="mt-4 text-sm text-slate-400">Procesando pago...</p>
                <p className="mt-1 text-xs text-slate-500">Esto puede tomar unos segundos</p>
              </div>
            )}

            {step === 'success' && (
              <div className="flex flex-col items-center py-12" role="status">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10">
                  <svg className="h-6 w-6 text-emerald-400" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="mt-4 text-sm font-medium text-white">Pago exitoso</p>
                <p className="mt-1 text-xs text-slate-400">Plan activado correctamente</p>
              </div>
            )}

            {step === 'rejected' && (
              <div className="flex flex-col items-center py-12" role="alert">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/10">
                  <svg className="h-6 w-6 text-rose-400" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <p className="mt-4 text-sm font-medium text-white">Pago rechazado</p>
                <p className="mt-1 text-xs text-slate-400">Intenta de nuevo o usa otro metodo de pago</p>
                <button
                  type="button"
                  onClick={() => setStep('gateway')}
                  className="mt-4 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                >
                  Intentar de nuevo
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Purchase history */}
      {purchases.length > 0 && (
        <div className="mt-12">
          <h2 className="text-lg font-semibold text-white">Historial de compras</h2>
          <p className="mt-1 text-xs text-slate-500">
            Cada compra tiene una vigencia de 1 mes. Las compras desactivadas no aportan cuotas al workspace.
          </p>
          <div className="mt-4 overflow-x-auto rounded-md border border-slate-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-left text-xs uppercase text-slate-500">
                  <th className="px-4 py-3">Plan</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Periodo</th>
                  <th className="px-4 py-3">Monto</th>
                  <th className="px-4 py-3">Accion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {purchases.map((p) => {
                  const isActive = p.status === 'active';
                  const isCancelled = p.status === 'cancelled';
                  const isExpired = p.status === 'expired';
                  const isFree = p.amount === 0;
                  const purchasedDate = new Date(p.purchasedAt);
                  const expiresDate = new Date(p.expiresAt);
                  const now = new Date();
                  const diffDays = Math.ceil(
                    (expiresDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
                  );
                  const pastDays = Math.ceil(
                    (now.getTime() - expiresDate.getTime()) / (1000 * 60 * 60 * 24)
                  );

                  const fmt = (d: Date) =>
                    `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;

                  let periodInfo = '';
                  if (isFree) {
                    periodInfo = 'Cuota mensual automatica';
                  } else if (isActive && diffDays > 0) {
                    periodInfo = `Quedan ${diffDays} dia${diffDays !== 1 ? 's' : ''}`;
                  } else if (isCancelled) {
                    periodInfo = 'Desactivada';
                  } else if (isExpired || diffDays <= 0) {
                    periodInfo = `Expiro hace ${pastDays} dia${pastDays !== 1 ? 's' : ''}`;
                  }

                  return (
                    <tr key={p._id} className="hover:bg-slate-900/50">
                      <td className="whitespace-nowrap px-4 py-3 font-medium text-white">
                        {p.planName}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            isFree
                              ? 'bg-sky-500/10 text-sky-400'
                              : isActive
                                ? 'bg-emerald-500/10 text-emerald-400'
                                : isCancelled
                                  ? 'bg-rose-500/10 text-rose-400'
                                  : 'bg-amber-500/10 text-amber-400'
                          }`}
                        >
                          {isFree ? 'Gratuita' : isActive ? 'Activa' : isCancelled ? 'Desactivada' : 'Expirada'}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <p className="text-slate-300">
                          {fmt(purchasedDate)} — {isFree ? '∞' : fmt(expiresDate)}
                        </p>
                        <p
                          className={`text-xs ${
                            isFree
                              ? 'text-sky-400'
                              : isActive
                                ? 'text-emerald-500'
                                : isCancelled
                                  ? 'text-rose-400'
                                  : 'text-amber-400'
                          }`}
                        >
                          {periodInfo}
                        </p>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-300">
                        {isFree ? 'Gratis' : `${p.amount.toLocaleString('es-CO')} ${p.currency}`}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        {isFree || isExpired ? (
                          <span className="text-xs text-slate-500">—</span>
                        ) : isActive ? (
                          <button
                            onClick={() => handleToggle(p._id, 'cancelled')}
                            disabled={toggling === p._id}
                            className={`rounded-md px-3 py-1 text-xs font-medium bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors ${toggling === p._id ? 'opacity-50' : ''}`}
                          >
                            {toggling === p._id ? '...' : 'Desactivar'}
                          </button>
                        ) : (
                          (() => {
                            const exp = new Date(p.expiresAt);
                            if (exp > new Date()) {
                              return (
                                <button
                                  onClick={() => handleToggle(p._id, 'active')}
                                  disabled={toggling === p._id}
                                  className={`rounded-md px-3 py-1 text-xs font-medium bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors ${toggling === p._id ? 'opacity-50' : ''}`}
                                >
                                  {toggling === p._id ? '...' : 'Reactivar'}
                                </button>
                              );
                            }
                            const plan = plans.find((pl) => pl._id === p.plan);
                            return plan ? (
                              <button
                                onClick={() => openGateway(plan)}
                                className="rounded-md px-3 py-1 text-xs font-medium bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition-colors"
                              >
                                Renovar
                              </button>
                            ) : (
                              <span className="text-xs text-slate-500">—</span>
                            );
                          })()
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <PaginationBar
            page={purchPage}
            totalPages={purchTotalPages}
            total={purchTotal}
            limit={purchLimit}
            onPageChange={(p) => {
              setPurchPage(p);
              loadPurchases(p, purchLimit);
            }}
            onLimitChange={(l) => {
              setPurchLimit(l);
              setPurchPage(1);
              loadPurchases(1, l);
            }}
          />
        </div>
      )}
    </div>
  );
}
