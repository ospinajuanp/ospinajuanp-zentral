'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useToastContext } from '@/contexts/toast-context';
import { Button, StatusCard } from '@/components/ui';

interface WorkspaceData {
  _id: string;
  name: string;
  slug: string;
  isActive: boolean;
}

export default function WorkspaceSettingsPage() {
  const [workspace, setWorkspace] = useState<WorkspaceData | null>(null);
  const [loading, setLoading] = useState(true);
  const toast = useToastContext();
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');

  useEffect(() => {
    fetch('/api/auth/session')
      .then((res) => res.json())
      .then(async (session) => {
        if (!session.authenticated || !session.workspaceId) {
          toast.error('No tienes un workspace asociado');
          setLoading(false);
          return;
        }
        const res = await fetch(`/api/workspaces/${session.workspaceId}`);
        const data = await res.json();
        if (data.workspace) {
          setWorkspace(data.workspace);
          setName(data.workspace.name);
        } else {
          toast.error('Workspace no encontrado');
        }
      })
      .catch(() => toast.error('Error al cargar datos'))
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!workspace) return;
    setSaving(true);

    try {
      const res = await fetch(`/api/workspaces/${workspace._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? 'Error al actualizar');
        return;
      }

      toast.success('Nombre del workspace actualizado correctamente.');
    } catch {
      toast.error('Error de conexión');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-lg">
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
        </div>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="mx-auto max-w-lg">
        <StatusCard type="error" message="No se pudo cargar el workspace" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="text-2xl font-bold tracking-tight text-white">Configuración del workspace</h1>
      <p className="mt-1 text-sm text-slate-400">
        Slug: <span className="font-mono">{workspace.slug}</span>
      </p>

      <form onSubmit={handleSubmit} className="mt-8 rounded-md border border-slate-800 bg-slate-900 p-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-slate-400">
            Nombre del workspace
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

        <Button type="submit" loading={saving} className="mt-6 w-full">
          {saving ? 'Guardando…' : 'Guardar cambios'}
        </Button>
      </form>
    </div>
  );
}
