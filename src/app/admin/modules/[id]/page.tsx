'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ErrorMessage, Button, ConfirmDialog } from '@/components/ui';
import type { ModuleTier } from '@/types';

interface ModuleData {
  _id: string;
  key: string;
  name: string;
  description: string;
  tier: ModuleTier;
  status: string;
  defaultQuota: number;
  visible: boolean;
  icon?: string;
}

const moduleStatuses: { value: string; label: string }[] = [
  { value: 'active', label: 'Activo' },
  { value: 'inactive', label: 'Inactivo' },
  { value: 'coming_soon', label: 'Próximamente' },
];

export default function EditModulePage() {
  const router = useRouter();
  const params = useParams();
  const modId = params.id as string;

  const [name, setName] = useState('');
  const [key, setKey] = useState('');
  const [description, setDescription] = useState('');
  const [tier, setTier] = useState<ModuleTier>('free');
  const [status, setStatus] = useState('active');
  const [defaultQuota, setDefaultQuota] = useState(100);
  const [visible, setVisible] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/modules/${modId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.module) {
          const m = data.module as ModuleData;
          setName(m.name);
          setKey(m.key);
          setDescription(m.description ?? '');
          setTier(m.tier);
          setStatus(m.status);
          setDefaultQuota(m.defaultQuota);
          setVisible(m.visible ?? true);
        } else {
          setError('Módulo no encontrado');
        }
      })
      .catch(() => setError('Error al cargar'))
      .finally(() => setLoading(false));
  }, [modId]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      const res = await fetch(`/api/admin/modules/${modId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, tier, status, defaultQuota: Number(defaultQuota), visible }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Error al actualizar');
        return;
      }

      setSuccess('Módulo actualizado correctamente');
    } catch {
      setError('Error de conexión');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/modules/${modId}`, { method: 'DELETE' });
      if (res.ok) {
        router.push('/admin/modules');
      } else {
        const data = await res.json();
        setError(data.error ?? 'Error al eliminar');
        setDeleteConfirm(false);
      }
    } catch {
      setError('Error de conexión');
      setDeleteConfirm(false);
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg">
      <Link href="/admin/modules" className="text-sm text-slate-400 hover:text-slate-300">
        ← Volver a Módulos
      </Link>

      <h1 className="mt-4 text-2xl font-bold tracking-tight text-white">Editar módulo</h1>
      <p className="mt-1 text-sm text-slate-400">
        {key} — Configuración del módulo.
      </p>

      {error && <ErrorMessage message={error} />}
      {success && (
        <div className="mb-4 rounded-md border border-emerald-800 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-500">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-8 rounded-md border border-slate-800 bg-slate-900 p-6">
        <div className="space-y-4">
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
            <label htmlFor="key" className="block text-sm font-medium text-slate-400">
              Key
            </label>
            <input
              id="key"
              type="text"
              disabled
              value={key}
              className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-slate-500"
            />
            <p className="mt-1 text-xs text-slate-500">No se puede cambiar la key.</p>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-slate-400">
              Descripción
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="tier" className="block text-sm font-medium text-slate-400">
                Tier
              </label>
              <select
                id="tier"
                value={tier}
                onChange={(e) => setTier(e.target.value as ModuleTier)}
                className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
              >
                <option value="free">Free</option>
                <option value="premium">Premium</option>
              </select>
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-slate-400">
                Estado
              </label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
              >
                {moduleStatuses.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input
              id="visible"
              type="checkbox"
              checked={visible}
              onChange={(e) => setVisible(e.target.checked)}
              className="h-4 w-4 rounded border-slate-700 bg-slate-800 text-indigo-500 focus:ring-indigo-500"
            />
            <div>
              <label htmlFor="visible" className="text-sm font-medium text-slate-400">
                Visible en landing y planes
              </label>
              <p className="text-xs text-slate-500">Si se desactiva, el modulo no aparecera en la pagina publica ni al crear planes.</p>
            </div>
          </div>

          <div>
            <label htmlFor="defaultQuota" className="block text-sm font-medium text-slate-400">
              Cuota mensual por defecto
            </label>
            <input
              id="defaultQuota"
              type="number"
              min={0}
              required
              value={defaultQuota}
              onChange={(e) => setDefaultQuota(Number(e.target.value))}
              className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />
            <p className="mt-1 text-xs text-slate-500">0 = consultas ilimitadas. Se usa como valor inicial al asignar a un workspace.</p>
          </div>
        </div>

        <Button type="submit" loading={saving} className="mt-6 w-full">
          {saving ? 'Guardando…' : 'Guardar cambios'}
        </Button>
      </form>

      <div className="mt-6 rounded-md border border-slate-800 bg-slate-900 p-6">
        <h2 className="text-lg font-semibold text-white">Zona de peligro</h2>
        <p className="mt-2 text-sm text-slate-400">
          Eliminar este módulo no afecta las suscripciones activas de los workspaces.
        </p>

        <button
          onClick={() => setDeleteConfirm(true)}
          className="mt-4 rounded-md border border-rose-800 bg-rose-500/10 px-4 py-2 text-sm font-medium text-rose-400 transition-colors hover:bg-rose-500/20"
        >
          Eliminar módulo
        </button>

        <ConfirmDialog
          open={deleteConfirm}
          title="Eliminar módulo"
          message="¿Estás seguro de eliminar este módulo del catálogo?"
          itemName={name}
          loading={deleting}
          onConfirm={handleDelete}
          onCancel={() => setDeleteConfirm(false)}
        />
      </div>
    </div>
  );
}
