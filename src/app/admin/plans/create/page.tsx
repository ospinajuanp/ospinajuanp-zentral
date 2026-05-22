'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ErrorMessage, Button, StatusCard } from '@/components/ui';

interface ModuleOption {
  _id: string;
  key: string;
  name: string;
  defaultQuota: number;
  tier: string;
}

interface SelectedModule {
  moduleId: string;
  name: string;
  key: string;
  defaultQuota: number;
  quotaOverride: string;
}

interface PlanOption {
  _id: string;
  name: string;
  includedModules: { module: ModuleOption; quotaOverride: number | null }[];
  maxUsers: number;
  extraFeatures: string[];
  description: string;
  support: string;
  onboarding: string;
}

export default function CreatePlanPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [monthlyPrice, setMonthlyPrice] = useState('');
  const [description, setDescription] = useState('');
  const [maxUsers, setMaxUsers] = useState('1');
  const [cta, setCta] = useState('Empezar');
  const [ctaLink, setCtaLink] = useState('/register');
  const [highlighted, setHighlighted] = useState(false);
  const [isEnterprise, setIsEnterprise] = useState(false);
  const [sortOrder, setSortOrder] = useState(0);

  const [availableModules, setAvailableModules] = useState<ModuleOption[]>([]);
  const [availablePlans, setAvailablePlans] = useState<PlanOption[]>([]);

  const [inheritedModules, setInheritedModules] = useState<SelectedModule[]>([]);
  const [basePlanName, setBasePlanName] = useState('');
  const [selectedModules, setSelectedModules] = useState<SelectedModule[]>([]);
  const [extraFeaturesText, setExtraFeaturesText] = useState('');
  const [support, setSupport] = useState('ninguno');
  const [onboarding, setOnboarding] = useState('ninguno');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState(false);

  useEffect(() => {
    fetch('/api/admin/modules')
      .then((res) => res.json())
      .then((data) => {
        if (data.modules) setAvailableModules(data.modules);
      })
      .catch(() => {});
    fetch('/api/admin/plans')
      .then((res) => res.json())
      .then((data) => {
        if (data.plans) {
          setAvailablePlans(data.plans);
          setSortOrder(data.plans.length + 1);
        }
      })
      .catch(() => {});
  }, []);

  function toggleModule(mod: ModuleOption) {
    setSelectedModules((prev) => {
      const exists = prev.find((m) => m.moduleId === mod._id);
      if (exists) return prev.filter((m) => m.moduleId !== mod._id);
      return [
        ...prev,
        {
          moduleId: mod._id,
          name: mod.name,
          key: mod.key,
          defaultQuota: mod.defaultQuota,
          quotaOverride: String(mod.defaultQuota),
        },
      ];
    });
  }

  function updateQuotaOverride(moduleId: string, value: string) {
    setSelectedModules((prev) =>
      prev.map((m) => (m.moduleId === moduleId ? { ...m, quotaOverride: value } : m))
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const extraFeatures = extraFeaturesText
      .split('\n')
      .map((f) => f.trim())
      .filter(Boolean);

    const includedModules = [...inheritedModules, ...selectedModules].map((m) => ({
      module: m.moduleId,
      quotaOverride: m.quotaOverride ? Number(m.quotaOverride) : null,
    }));

    try {
      const res = await fetch('/api/admin/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          price,
          monthlyPrice: monthlyPrice ? Number(monthlyPrice) : null,
          description,
          includedModules,
          maxUsers: Number(maxUsers),
          extraFeatures,
          support,
          onboarding,
      cta,
      ctaLink,
      highlighted,
      isEnterprise,
      sortOrder: Number(sortOrder),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Error al crear plan');
        return;
      }

      setCreated(true);
    } catch {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  }

  if (created) {
    return (
      <div className="mx-auto max-w-lg">
        <StatusCard
          type="success"
          message={`Plan "${name}" creado correctamente.`}
          action={{ label: 'Volver a planes', href: '/admin/plans' }}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/admin/plans" className="text-sm text-slate-400 hover:text-slate-300">
        ← Volver a Planes
      </Link>

      <h1 className="mt-4 text-2xl font-bold tracking-tight text-white">Nuevo plan</h1>
      <p className="mt-1 text-sm text-slate-400">
        Crea un nuevo plan de precios con módulos seleccionables.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        {error && <ErrorMessage message={error} />}

        {/* info */}
        <div className="rounded-md border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-lg font-semibold text-white">Información</h2>
          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-400">Nombre</label>
                <input id="name" type="text" required value={name} onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                  placeholder="Premium" />
              </div>
              <div>
                <label htmlFor="price" className="block text-sm font-medium text-slate-400">Precio (opcional)</label>
                <input id="price" type="text" value={price} onChange={(e) => setPrice(e.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                  placeholder="$12, A medida o vacío" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="monthlyPrice" className="block text-sm font-medium text-slate-400">Precio mensual (número)</label>
                <input id="monthlyPrice" type="number" step="0.01" value={monthlyPrice} onChange={(e) => setMonthlyPrice(e.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none" />
              </div>
              <div>
                <label htmlFor="maxUsers" className="block text-sm font-medium text-slate-400">Usuarios máximos</label>
                <input id="maxUsers" type="number" min={0} required value={maxUsers} onChange={(e) => setMaxUsers(e.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none" />
              </div>
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-slate-400">Descripción</label>
              <input id="description" type="text" value={description} onChange={(e) => setDescription(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                placeholder="Para equipos que necesitan más." />
            </div>
          </div>
        </div>

        {/* modules */}
        <div className="rounded-md border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-lg font-semibold text-white">Módulos incluidos</h2>

          {/* "Basado en" selector */}
          {availablePlans.length > 0 && (
            <div className="mt-3 rounded-md border border-slate-700 bg-slate-950 p-3">
              <label className="block text-xs font-medium text-slate-400">Basado en (hereda módulos, usuarios y características)</label>
              <select
                value={basePlanName ? availablePlans.find((p) => p.name === basePlanName)?._id ?? '' : ''}
                onChange={(e) => {
                  const pid = e.target.value;
                  if (!pid) {
                    setInheritedModules([]);
                    setBasePlanName('');
                    return;
                  }
                  const plan = availablePlans.find((p) => p._id === pid);
                  if (!plan || !plan.includedModules) return;
                  setInheritedModules(
                    plan.includedModules
                      .filter((im) => im.module)
                      .map((im) => ({
                        moduleId: im.module._id,
                        name: im.module.name,
                        key: im.module.key,
                        defaultQuota: im.module.defaultQuota,
                        quotaOverride: String(im.quotaOverride ?? im.module.defaultQuota),
                      }))
                  );
                  setSelectedModules([]);
                  setBasePlanName(plan.name);
                  if (plan.maxUsers) setMaxUsers(String(plan.maxUsers));
                  if (plan.extraFeatures?.length) setExtraFeaturesText(plan.extraFeatures.join('\n'));
                  if (plan.description) setDescription(plan.description);
                  setSupport(plan.support ?? 'ninguno');
                  setOnboarding(plan.onboarding ?? 'ninguno');
                }}
                className="mt-1 w-full rounded border border-slate-700 bg-slate-800 px-2 py-1.5 text-sm text-white"
              >
                <option value="">— Personalizado (vacío) —</option>
                {availablePlans.map((p) => (
                  <option key={p._id} value={p._id}>{p.name}</option>
                ))}
              </select>
              {basePlanName && (
                <p className="mt-1 text-xs text-slate-500">
                  Heredado de <span className="font-medium text-slate-300">{basePlanName}</span> ({inheritedModules.length} módulo{inheritedModules.length !== 1 ? 's' : ''})
                </p>
              )}
            </div>
          )}

          {/* inherited modules banner */}
          {inheritedModules.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-xs font-medium text-slate-400">Heredado de {basePlanName}:</p>
              {inheritedModules.map((im) => (
                <div key={im.moduleId} className="flex items-center gap-3 rounded-md border border-slate-700/50 bg-slate-800/30 p-3">
                  <span className="text-xs text-slate-500">✓</span>
                  <span className="text-sm text-slate-300">{im.name}</span>
                  <span className="text-xs text-slate-500">({im.key})</span>
                  <span className="ml-auto text-xs text-slate-500">
                    Cuota: {im.quotaOverride ? Number(im.quotaOverride).toLocaleString() : 'N/A'}
                  </span>
                </div>
              ))}
              <hr className="border-slate-700/50" />
            </div>
          )}

          {/* selectable modules (only those not inherited) */}
          {(() => {
            const inheritedIds = new Set(inheritedModules.map((m) => m.moduleId));
            const selectableModules = availableModules.filter((mod) => !inheritedIds.has(mod._id));
            const selectableCount = selectableModules.length;
            const selectedCount = selectedModules.length;

            return (
              <>
                <div className="flex items-center justify-between mt-3">
                  <p className="text-xs text-slate-500">
                    {selectableCount === 0
                      ? (inheritedModules.length > 0 ? 'Ya están todos los módulos heredados.' : 'No hay módulos disponibles.')
                      : `Módulos adicionales${basePlanName ? ' (no heredados)' : ''}:`}
                  </p>
                  {selectableCount > 0 && (
                    <div className="flex items-center gap-3">
                      {selectableModules.some((m) => m.tier === 'free') && (
                        <button type="button" onClick={() => setSelectedModules(
                          selectableModules.filter((mod) => mod.tier === 'free').map((mod) => ({
                            moduleId: mod._id, name: mod.name, key: mod.key,
                            defaultQuota: mod.defaultQuota, quotaOverride: String(mod.defaultQuota),
                          }))
                        )} className="text-xs text-emerald-400 hover:text-emerald-300 underline underline-offset-2">
                          Gratis
                        </button>
                      )}
                      {selectableModules.some((m) => m.tier === 'premium') && (
                        <button type="button" onClick={() => setSelectedModules(
                          selectableModules.filter((mod) => mod.tier === 'premium').map((mod) => ({
                            moduleId: mod._id, name: mod.name, key: mod.key,
                            defaultQuota: mod.defaultQuota, quotaOverride: String(mod.defaultQuota),
                          }))
                        )} className="text-xs text-indigo-400 hover:text-indigo-300 underline underline-offset-2">
                          Premium
                        </button>
                      )}
                      <button type="button" onClick={() => {
                        if (selectedCount === selectableCount) {
                          setSelectedModules([]);
                        } else {
                          setSelectedModules(
                            selectableModules.map((mod) => ({
                              moduleId: mod._id, name: mod.name, key: mod.key,
                              defaultQuota: mod.defaultQuota, quotaOverride: String(mod.defaultQuota),
                            }))
                          );
                        }
                      }} className="text-xs text-slate-400 hover:text-slate-300 underline underline-offset-2">
                        {selectedCount === selectableCount ? 'Ninguno' : 'Todos'}
                      </button>
                    </div>
                  )}
                </div>

                <div className="mt-3 space-y-2">
                  {selectableModules.map((mod) => {
                    const selected = selectedModules.find((m) => m.moduleId === mod._id);
                    return (
                      <div
                        key={mod._id}
                        className={`flex items-center gap-3 rounded-md border p-3 transition-colors ${
                          selected ? 'border-indigo-700 bg-indigo-500/5' : 'border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          id={`mod-${mod._id}`}
                          checked={!!selected}
                          onChange={() => toggleModule(mod)}
                          className="h-4 w-4 rounded border-slate-700 bg-slate-800 text-indigo-500 focus:ring-indigo-500"
                        />
                        <label htmlFor={`mod-${mod._id}`} className="flex-1 cursor-pointer">
                          <span className="text-sm font-medium text-white">{mod.name}</span>
                          <span className="ml-2 text-xs text-slate-500">({mod.key})</span>
                          <span className={`ml-2 rounded-full px-2 py-0.5 text-xs ${
                            mod.tier === 'free' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-indigo-500/10 text-indigo-400'
                          }`}>
                            {mod.tier === 'free' ? 'Gratis' : 'Premium'}
                          </span>
                        </label>
                        {selected && (
                          <div className="flex items-center gap-2">
                            <label className="text-xs text-slate-500">Cuota:</label>
                            <input
                              type="number"
                              min={0}
                              value={selected.quotaOverride}
                              onChange={(e) => updateQuotaOverride(mod._id, e.target.value)}
                              className="w-20 rounded border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-white"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {selectableCount === 0 && inheritedModules.length === 0 && availableModules.length > 0 && (
                    <p className="text-sm text-slate-500">No hay módulos disponibles.</p>
                  )}
                </div>
              </>
            );
          })()}

          {(inheritedModules.length > 0 || selectedModules.length > 0) && (
            <div className="mt-3 rounded-md bg-slate-950 p-3">
              <p className="text-xs text-slate-500">
                {inheritedModules.length + selectedModules.length} módulo{inheritedModules.length + selectedModules.length !== 1 ? 's' : ''} en total.
                {basePlanName && ` (${inheritedModules.length} heredados de ${basePlanName})`}
                {(inheritedModules.length > 0 || selectedModules.every((m) => Number(m.quotaOverride) > 0)) && (
                  <span> Cuota total: {[...inheritedModules, ...selectedModules].reduce((s, m) => s + Number(m.quotaOverride), 0)}/mes.</span>
                )}
              </p>
            </div>
          )}
        </div>

        {/* extra features */}
        <div className="rounded-md border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-lg font-semibold text-white">Características adicionales</h2>
          <p className="mt-1 text-xs text-slate-500">Funcionalidades extra que no son módulos (una por línea).</p>
          <textarea
            value={extraFeaturesText}
            onChange={(e) => setExtraFeaturesText(e.target.value)}
            rows={4}
            className="mt-3 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            placeholder="Soporte por email&#10;Módulos en beta gratis"
          />
        </div>

        {/* support & onboarding */}
        <div className="rounded-md border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-lg font-semibold text-white">Soporte y Onboarding</h2>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="support" className="block text-sm font-medium text-slate-400">Soporte</label>
              <select id="support" value={support} onChange={(e) => setSupport(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
              >
                <option value="ninguno">Ninguno</option>
                <option value="email">Email</option>
                <option value="prioritario">Prioritario</option>
                <option value="canales">Canales (Email + Chat)</option>
                <option value="dedicado">Dedicado</option>
              </select>
            </div>
            <div>
              <label htmlFor="onboarding" className="block text-sm font-medium text-slate-400">Onboarding</label>
              <select id="onboarding" value={onboarding} onChange={(e) => setOnboarding(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
              >
                <option value="ninguno">Ninguno</option>
                <option value="autoguiado">Autoguiado</option>
                <option value="videos">Videos</option>
                <option value="documentacion">Documentación</option>
                <option value="dedicado">Dedicado</option>
              </select>
            </div>
          </div>
        </div>

        {/* config */}
        <div className="rounded-md border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-lg font-semibold text-white">Configuración</h2>
          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="cta" className="block text-sm font-medium text-slate-400">Texto del botón</label>
                <input id="cta" type="text" value={cta} onChange={(e) => setCta(e.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none" />
              </div>
              <div>
                <label htmlFor="ctaLink" className="block text-sm font-medium text-slate-400">Link del botón</label>
                <input id="ctaLink" type="text" value={ctaLink} onChange={(e) => setCtaLink(e.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white font-mono placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                  placeholder="/register o https://wa.me/..." />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="sortOrder" className="block text-sm font-medium text-slate-400">Orden</label>
                <input id="sortOrder" type="number" value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value))}
                  className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none" />
              </div>
              <div></div>
            </div>
            <div className="flex items-center gap-3">
              <input id="highlighted" type="checkbox" checked={highlighted} onChange={(e) => setHighlighted(e.target.checked)}
                className="h-4 w-4 rounded border-slate-700 bg-slate-800 text-indigo-500 focus:ring-indigo-500" />
              <label htmlFor="highlighted" className="text-sm font-medium text-slate-400">Plan destacado</label>
            </div>
            <div className="flex items-center gap-3">
              <input id="isEnterprise" type="checkbox" checked={isEnterprise} onChange={(e) => setIsEnterprise(e.target.checked)}
                className="h-4 w-4 rounded border-slate-700 bg-slate-800 text-amber-500 focus:ring-amber-500" />
              <label htmlFor="isEnterprise" className="text-sm font-medium text-slate-400">Enterprise (a medida)</label>
            </div>
          </div>
        </div>

        <Button type="submit" loading={loading} className="w-full">
          {loading ? 'Creando…' : 'Crear plan'}
        </Button>
      </form>
    </div>
  );
}
