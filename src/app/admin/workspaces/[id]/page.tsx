'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ErrorMessage, Button, StatusCard, ConfirmDialog } from '@/components/ui';

interface WorkspaceData {
  _id: string;
  name: string;
  slug: string;
  isActive: boolean;
  owner?: { _id: string; name: string; email: string } | null;
}

interface UserSummary {
  _id: string;
  name: string;
  email: string;
  role: string;
}

interface ModuleSubSummary {
  _id: string;
  moduleKey: string;
  tier: string;
  status: string;
}

export default function WorkspaceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const wsId = params.id as string;

  const [workspace, setWorkspace] = useState<WorkspaceData | null>(null);
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [subscriptions, setSubscriptions] = useState<ModuleSubSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [isActive, setIsActive] = useState(true);

  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/workspaces/${wsId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.workspace) {
          setWorkspace(data.workspace);
          setName(data.workspace.name);
          setSlug(data.workspace.slug);
          setIsActive(data.workspace.isActive);
          setUsers(data.users ?? []);
          setSubscriptions(data.subscriptions ?? []);
        } else {
          setError('Workspace no encontrado');
        }
      })
      .catch(() => setError('Error al cargar'))
      .finally(() => setLoading(false));
  }, [wsId]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      const res = await fetch(`/api/admin/workspaces/${wsId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, slug, isActive }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Error al actualizar');
        return;
      }

      setSuccess('Workspace actualizado correctamente');
    } catch {
      setError('Error de conexión');
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

  if (!workspace) {
    return (
      <StatusCard
        type="error"
        message={error || 'Workspace no encontrado'}
        action={{ label: 'Volver a workspaces', href: '/admin/workspaces' }}
      />
    );
  }

  return (
    <div>
      <Link href="/admin/workspaces" className="text-sm text-slate-400 hover:text-slate-300">
        ← Volver a Workspaces
      </Link>

      <h1 className="mt-4 text-2xl font-bold tracking-tight text-white">Editar workspace</h1>

      {error && <ErrorMessage message={error} />}
      {success && (
        <div className="mb-4 rounded-md border border-emerald-800 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-500">
          {success}
        </div>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <form onSubmit={handleSubmit} className="rounded-md border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-lg font-semibold text-white">Información</h2>

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
          </div>

          <Button type="submit" loading={saving} className="mt-6">
            {saving ? 'Guardando…' : 'Guardar cambios'}
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
          <h2 className="text-lg font-semibold text-white">
            Módulos ({subscriptions.length})
          </h2>
          <ul className="mt-4 space-y-3">
            {subscriptions.length === 0 ? (
              <p className="text-sm text-slate-500">Sin módulos activos.</p>
            ) : (
              subscriptions.map((sub) => (
                <li key={sub._id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white">{sub.moduleKey}</p>
                    <p className="text-xs text-slate-500">
                      {sub.tier === 'free' ? 'Gratis' : 'Premium'} —{' '}
                      {sub.status === 'active' ? 'Activo' : sub.status}
                    </p>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>

      <div className="mt-6 rounded-md border border-slate-800 bg-slate-900 p-6">
        <h2 className="text-lg font-semibold text-white">Zona de peligro</h2>
        <p className="mt-2 text-sm text-slate-400">
          Eliminar este workspace desvinculará a todos sus usuarios y eliminará las suscripciones de módulos.
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
          message="¿Estás seguro de eliminar este workspace? Se desvincularán todos los usuarios y se eliminarán las suscripciones de módulos."
          itemName={workspace.name}
          loading={deleting}
          onConfirm={handleDelete}
          onCancel={() => setDeleteConfirm(false)}
        />
      </div>
    </div>
  );
}
