'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Button, StatusCard, ConfirmDialog } from '@/components/ui';
import { useToastContext } from '@/contexts/toast-context';

interface WorkspaceData {
  _id: string;
  name: string;
  slug: string;
  isActive: boolean;
  isPayReady: boolean;
  owner?: { _id: string; name: string; email: string } | null;
  plans?: { _id: string; name: string; price: string; isEnterprise: boolean }[];
}

interface UserSummary {
  _id: string;
  name: string;
  email: string;
  role: string;
}

interface SubSummary {
  _id: string;
  moduleKey: string;
  tier: string;
  status: string;
  monthlyQuota: number;
  usedQuota: number;
  autoRenew?: boolean;
}

interface ModuleOption {
  _id: string;
  key: string;
  name: string;
  defaultQuota: number;
}

const TIER_LABELS: Record<string, string> = {
  free: 'Gratis',
  premium: 'Premium',
  enterprise: 'Enterprise',
};

const TIER_CLASSES: Record<string, string> = {
  free: 'bg-emerald-500/10 text-emerald-500',
  premium: 'bg-indigo-500/10 text-indigo-400',
  enterprise: 'bg-amber-500/10 text-amber-400',
};

export default function WorkspaceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const wsId = params.id as string;

  const [workspace, setWorkspace] = useState<WorkspaceData | null>(null);
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [subscriptions, setSubscriptions] = useState<SubSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const toast = useToastContext();

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isPayReady, setIsPayReady] = useState(false);

  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [availableModules, setAvailableModules] = useState<ModuleOption[]>([]);
  const [showAddModule, setShowAddModule] = useState(false);
  const [selectedModuleKey, setSelectedModuleKey] = useState('');
  const [addModuleTier, setAddModuleTier] = useState('enterprise');
  const [addModuleQuota, setAddModuleQuota] = useState(100);
  const [addModuleAutoRenew, setAddModuleAutoRenew] = useState(false);
  const [addingModule, setAddingModule] = useState(false);
  const [addModuleError, setAddModuleError] = useState('');

  const [removeSubId, setRemoveSubId] = useState<string | null>(null);
  const [removingModule, setRemovingModule] = useState(false);

  const [editSubId, setEditSubId] = useState<string | null>(null);
  const [editSubQuota, setEditSubQuota] = useState(0);
  const [editSubTier, setEditSubTier] = useState('free');
  const [editSubStatus, setEditSubStatus] = useState('active');
  const [editSubAutoRenew, setEditSubAutoRenew] = useState(false);
  const [savingSub, setSavingSub] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/workspaces/${wsId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.workspace) {
          setWorkspace(data.workspace);
          setName(data.workspace.name);
          setSlug(data.workspace.slug);
          setIsActive(data.workspace.isActive);
          setIsPayReady(data.workspace.isPayReady ?? false);
          setUsers(data.users ?? []);
          setSubscriptions(data.subscriptions ?? []);
        } else {
          toast.error('Workspace no encontrado');
        }
      })
      .catch(() => toast.error('Error al cargar'))
      .finally(() => setLoading(false));
  }, [wsId]);

  useEffect(() => {
    fetch('/api/admin/modules')
      .then((res) => res.json())
      .then((data) => {
        if (data.items) setAvailableModules(data.items);
      })
      .catch((err) => { console.error(err); toast.error('Error de conexion'); });
  }, []);

  useEffect(() => {
    if (selectedModuleKey) {
      const mod = availableModules.find((m) => m.key === selectedModuleKey);
      if (mod) {
        const existing = subscriptions.find((s) => s.moduleKey === mod.key);
        if (existing) {
          setAddModuleQuota(existing.monthlyQuota);
          setAddModuleTier(existing.tier);
          setAddModuleAutoRenew(existing.autoRenew ?? false);
        } else {
          setAddModuleQuota(mod.defaultQuota);
          setAddModuleTier('enterprise');
          setAddModuleAutoRenew(false);
        }
      }
    }
  }, [selectedModuleKey, availableModules, subscriptions]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch(`/api/admin/workspaces/${wsId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, slug, isActive, isPayReady }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? 'Error al actualizar');
        return;
      }

      toast.success('Workspace actualizado correctamente');
    } catch {
      toast.error('Error de conexion');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/workspaces/${wsId}`, { method: 'DELETE' });
      if (res.ok) {
        router.push('/admin/workspaces');
      } else {
        const data = await res.json();
        toast.error(data.error ?? 'Error al eliminar');
        setDeleteConfirm(false);
      }
    } catch {
      toast.error('Error de conexion');
      setDeleteConfirm(false);
    } finally {
      setDeleting(false);
    }
  }

  async function handleAddModule() {
    if (!selectedModuleKey) return;
    setAddModuleError('');
    setAddingModule(true);

    try {
      const res = await fetch(`/api/admin/workspaces/${wsId}/subscriptions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moduleKey: selectedModuleKey,
          tier: addModuleTier,
          monthlyQuota: addModuleQuota,
          autoRenew: addModuleAutoRenew,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setAddModuleError(data.error ?? 'Error al agregar modulo');
        return;
      }

      setSubscriptions((prev) => {
        const idx = prev.findIndex((s) => s.moduleKey === data.subscription.moduleKey);
        if (idx >= 0) {
          const copy = [...prev];
          copy[idx] = data.subscription;
          return copy;
        }
        return [...prev, data.subscription];
      });
      setShowAddModule(false);
      setSelectedModuleKey('');
      setAddModuleTier('enterprise');
      setAddModuleAutoRenew(false);
    } catch {
      setAddModuleError('Error de conexion');
    } finally {
      setAddingModule(false);
    }
  }

  async function handleRemoveModule(subId: string) {
    setRemovingModule(true);
    try {
      const res = await fetch(`/api/admin/workspaces/${wsId}/subscriptions/${subId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setSubscriptions((prev) => prev.filter((s) => s._id !== subId));
      } else {
        const data = await res.json();
        toast.error(data.error ?? 'Error al eliminar modulo');
      }
    } catch {
      toast.error('Error de conexion');
    } finally {
      setRemovingModule(false);
      setRemoveSubId(null);
    }
  }

  function startEditSub(sub: SubSummary) {
    setEditSubId(sub._id);
    setEditSubQuota(sub.monthlyQuota);
    setEditSubTier(sub.tier);
    setEditSubStatus(sub.status);
    setEditSubAutoRenew(sub.autoRenew ?? false);
  }

  async function handleSaveSub() {
    if (!editSubId) return;
    setSavingSub(true);

    try {
      const res = await fetch(`/api/admin/workspaces/${wsId}/subscriptions/${editSubId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier: editSubTier,
          status: editSubStatus,
          monthlyQuota: Number(editSubQuota),
          autoRenew: editSubAutoRenew,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? 'Error al actualizar suscripcion');
        return;
      }

      setSubscriptions((prev) =>
        prev.map((s) => (s._id === editSubId ? { ...s, ...data.subscription } : s))
      );
      setEditSubId(null);
      toast.success('Suscripcion actualizada');
    } catch {
      toast.error('Error de conexion');
    } finally {
      setSavingSub(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  if (!workspace) {
    return (
      <StatusCard
        type="error"
        message="Workspace no encontrado"
        action={{ label: 'Volver a workspaces', href: '/admin/workspaces' }}
      />
    );
  }

  return (
    <div>
      <Link href="/admin/workspaces" className="text-sm text-slate-400 hover:text-slate-300">
        &larr; Volver a Workspaces
      </Link>

      <h1 className="mt-4 text-2xl font-bold tracking-tight text-white">Editar workspace</h1>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <form onSubmit={handleSubmit} className="rounded-md border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-lg font-semibold text-white">Informacion</h2>

          <div className="mt-4 space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-400">
                Nombre
              </label>
              <input
                id="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              />
                </div>

            <div>
              <label htmlFor="slug" className="block text-sm font-medium text-slate-400">
                Slug
              </label>
              <input
                id="slug"
                type="text"
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white font-mono placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-3">
              <input
                id="isActive"
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-4 w-4 rounded border-slate-700 bg-slate-800 text-indigo-500 focus:ring-indigo-500"
              />
              <label htmlFor="isActive" className="text-sm font-medium text-slate-400">
                Workspace activo
              </label>
            </div>

            <div className="flex items-center gap-3">
              <input
                id="isPayReady"
                type="checkbox"
                checked={isPayReady}
                onChange={(e) => setIsPayReady(e.target.checked)}
                className="h-4 w-4 rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-emerald-500"
              />
              <label htmlFor="isPayReady" className="text-sm font-medium text-slate-400">
                Pago confirmado
              </label>
            </div>

            {workspace.plans && workspace.plans.length > 0 && (
              <div className="rounded-md border border-slate-700/50 bg-slate-950 p-3">
                <p className="text-xs text-slate-500">Planes contratados:</p>
                {workspace.plans.map((p) => (
                  <div key={p._id} className="mt-1 flex items-center gap-2">
                    <p className="text-sm font-medium text-white">{p.name}</p>
                    {p.price && <p className="text-xs text-slate-400">{p.price}/mes</p>}
                    {p.isEnterprise && <span className="inline-block rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-500">Enterprise</span>}
                  </div>
                ))}
              </div>
            )}

            {!isPayReady && (
              <div className="rounded-md border border-amber-800/50 bg-amber-500/5 px-4 py-3 text-xs text-amber-400">
                Este workspace tiene modulos en estado &ldquo;inactivo&rdquo; esperando confirmacion de pago.
                Al marcar &ldquo;Pago confirmado&rdquo; se activaran todos los modulos automaticamente.
              </div>
            )}
          </div>

          <Button type="submit" loading={saving} className="mt-6">
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </form>

        <div className="rounded-md border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-lg font-semibold text-white">Usuarios ({users.length})</h2>
          <ul className="mt-4 space-y-3">
            {users.length === 0 ? (
              <p className="text-sm text-slate-500">Sin usuarios.</p>
            ) : (
              users.map((u) => (
                <li key={u._id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white">{u.name}</p>
                    <p className="text-xs text-slate-500">{u.email}</p>
                  </div>
                  <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-xs font-medium text-slate-400">
                    {u.role}
                  </span>
                </li>
              ))
            )}
          </ul>
        </div>

        <div className="rounded-md border border-slate-800 bg-slate-900 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">
              Modulos ({subscriptions.length})
            </h2>
            <button
              onClick={() => setShowAddModule(true)}
              className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700"
            >
              + Agregar
            </button>
          </div>

          {showAddModule && (
            <div className="mt-4 rounded-md border border-slate-700 bg-slate-950 p-4">
              <h3 className="text-sm font-medium text-white">Agregar modulo</h3>
              <p className="mt-1 text-xs text-slate-500">
                Si el modulo ya existe, se actualizaran sus valores.
              </p>
              {addModuleError && <p className="mt-1 text-xs text-rose-400">{addModuleError}</p>}

              <div className="mt-3 space-y-3">
                <div>
                  <label className="block text-xs text-slate-500">Modulo</label>
                  <select
                    value={selectedModuleKey}
                    onChange={(e) => setSelectedModuleKey(e.target.value)}
                    className="mt-1 w-full rounded border border-slate-700 bg-slate-800 px-2 py-1.5 text-sm text-white"
                  >
                    <option value="">Seleccionar...</option>
                    {availableModules.map((m) => {
                      const alreadySubscribed = subscriptions.some((s) => s.moduleKey === m.key);
                      return (
                        <option key={m.key} value={m.key}>
                          {m.name} ({m.key}){alreadySubscribed ? ' *' : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {selectedModuleKey && subscriptions.some((s) => s.moduleKey === selectedModuleKey) && (
                  <div className="rounded-md border border-indigo-800/50 bg-indigo-500/10 px-3 py-2 text-xs text-indigo-300">
                    Este modulo ya esta suscrito. Los valores actuales se cargaron en el formulario.
                    Al guardar, se actualizara la suscripcion existente.
                  </div>
                )}

                <div>
                  <label className="block text-xs text-slate-500">Tier</label>
                  <select
                    value={addModuleTier}
                    onChange={(e) => setAddModuleTier(e.target.value)}
                    className="mt-1 w-full rounded border border-slate-700 bg-slate-800 px-2 py-1.5 text-sm text-white"
                  >
                    <option value="free">Free</option>
                    <option value="premium">Premium</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-slate-500">Cuota mensual</label>
                  <input
                    type="number"
                    min={0}
                    value={addModuleQuota}
                    onChange={(e) => setAddModuleQuota(Number(e.target.value))}
                    className="mt-1 w-full rounded border border-slate-700 bg-slate-800 px-2 py-1.5 text-sm text-white"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={addModuleAutoRenew}
                      onChange={(e) => setAddModuleAutoRenew(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-700 bg-slate-800 text-indigo-500 focus:ring-indigo-500"
                    />
                    Auto-renovacion mensual
                  </label>
                  <p className="mt-1 text-xs text-slate-500">
                    Si se activa, la cuota se renovara automaticamente cada mes. Si no, es manual.
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleAddModule}
                    disabled={!selectedModuleKey || addingModule}
                    className="rounded bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {addingModule ? 'Agregando...' : 'Agregar'}
                  </button>
                  <button
                    onClick={() => { setShowAddModule(false); setAddModuleError(''); }}
                    className="rounded border border-slate-700 px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          )}

          <ul className="mt-4 space-y-3">
            {subscriptions.length === 0 ? (
              <p className="text-sm text-slate-500">Sin modulos asignados.</p>
            ) : (
              subscriptions.map((sub) => (
                <li key={sub._id} className="rounded-md border border-slate-800 bg-slate-950 p-3">
                  {editSubId === sub._id ? (
                    <div className="space-y-3">
                      <p className="text-sm font-medium text-white">{sub.moduleKey}</p>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs text-slate-500">Tier</label>
                          <select
                            value={editSubTier}
                            onChange={(e) => setEditSubTier(e.target.value)}
                            className="mt-1 w-full rounded border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-white"
                          >
                            <option value="free">Free</option>
                            <option value="premium">Premium</option>
                            <option value="enterprise">Enterprise</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-slate-500">Estado</label>
                          <select
                            value={editSubStatus}
                            onChange={(e) => setEditSubStatus(e.target.value)}
                            className="mt-1 w-full rounded border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-white"
                          >
                            <option value="active">Activo</option>
                            <option value="inactive">Inactivo</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-slate-500">Cuota mensual</label>
                          <input
                            type="number"
                            min={0}
                            value={editSubQuota}
                            onChange={(e) => setEditSubQuota(Number(e.target.value))}
                            className="mt-1 w-full rounded border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-white"
                          />
                        </div>
                        <div className="flex items-end">
                          <label className="flex items-center gap-2 text-xs text-slate-500 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={editSubAutoRenew}
                              onChange={(e) => setEditSubAutoRenew(e.target.checked)}
                              className="h-3.5 w-3.5 rounded border-slate-700 bg-slate-800 text-indigo-500 focus:ring-indigo-500"
                            />
                            Auto-renovacion
                          </label>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handleSaveSub}
                          disabled={savingSub}
                          className="rounded bg-indigo-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                        >
                          {savingSub ? 'Guardando...' : 'Guardar'}
                        </button>
                        <button
                          onClick={() => setEditSubId(null)}
                          className="rounded border border-slate-700 px-2.5 py-1 text-xs text-slate-400 hover:text-white"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white">{sub.moduleKey}</p>
                        <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-500">
                          <span className={`rounded-full px-2 py-0.5 font-medium ${TIER_CLASSES[sub.tier] ?? 'bg-slate-800 text-slate-400'}`}>
                            {TIER_LABELS[sub.tier] ?? sub.tier}
                          </span>
                          <span className={`rounded-full px-2 py-0.5 font-medium ${
                            sub.status === 'active'
                              ? 'bg-emerald-500/10 text-emerald-500'
                              : 'bg-rose-500/10 text-rose-500'
                          }`}>
                            {sub.status === 'active' ? 'Activo' : 'Inactivo'}
                          </span>
                          <span className="text-slate-500">
                            {sub.usedQuota}/{sub.monthlyQuota} consultas
                          </span>
                          {sub.autoRenew && (
                            <span className="rounded-full bg-indigo-500/10 px-2 py-0.5 text-xs font-medium text-indigo-400">
                              Auto-renovable
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEditSub(sub)}
                          className="text-xs font-medium text-indigo-400 hover:text-white"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => setRemoveSubId(sub._id)}
                          className="text-xs font-medium text-rose-400 hover:text-rose-300"
                        >
                          Quitar
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              ))
            )}
          </ul>

          <ConfirmDialog
            open={removeSubId !== null}
            title="Quitar modulo"
            message="Estas seguro de quitar este modulo del workspace? Los datos de uso se conservan."
            itemName={subscriptions.find((s) => s._id === removeSubId)?.moduleKey ?? ''}
            loading={removingModule}
            confirmLabel="Quitar"
            onConfirm={() => removeSubId && handleRemoveModule(removeSubId)}
            onCancel={() => setRemoveSubId(null)}
          />
        </div>
      </div>

      <div className="mt-6 rounded-md border border-slate-800 bg-slate-900 p-6">
        <h2 className="text-lg font-semibold text-white">Zona de peligro</h2>
        <p className="mt-2 text-sm text-slate-400">
          Eliminar este workspace desvinculara a todos sus usuarios y eliminara las suscripciones de modulos.
        </p>

        <button
          onClick={() => setDeleteConfirm(true)}
          className="mt-4 rounded-md border border-rose-800 bg-rose-500/10 px-4 py-2 text-sm font-medium text-rose-400 transition-colors hover:bg-rose-500/20"
        >
          Eliminar workspace
        </button>

        <ConfirmDialog
          open={deleteConfirm}
          title="Eliminar workspace"
          message="Estas seguro de eliminar este workspace? Se desvincularan todos los usuarios y se eliminaran las suscripciones de modulos."
          itemName={workspace.name}
          loading={deleting}
          onConfirm={handleDelete}
          onCancel={() => setDeleteConfirm(false)}
        />
      </div>
    </div>
  );
}
