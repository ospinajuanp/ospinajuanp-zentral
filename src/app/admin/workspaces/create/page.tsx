'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { ErrorMessage, Button, StatusCard } from '@/components/ui';

export default function CreateWorkspacePage() {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState(false);

  function handleNameChange(value: string) {
    setName(value);
    setSlug(value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/admin/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, slug }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Error al crear workspace');
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
          message={`Workspace "${name}" creado correctamente.`}
          action={{ label: 'Volver a workspaces', href: '/admin/workspaces' }}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg">
      <Link href="/admin/workspaces" className="text-sm text-slate-400 hover:text-slate-300">
        ← Volver a Workspaces
      </Link>

      <h1 className="mt-4 text-2xl font-bold tracking-tight text-white">Nuevo workspace</h1>
      <p className="mt-1 text-sm text-slate-400">
        Crea un nuevo workspace para un cliente o equipo.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 rounded-md border border-slate-800 bg-slate-900 p-6">
        {error && <ErrorMessage message={error} />}

        <div className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-400">
              Nombre del workspace
            </label>
            <input
              id="name"
              type="text"
              required
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              placeholder="Mi Empresa S.A.S."
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
              placeholder="mi-empresa"
            />
            <p className="mt-1 text-xs text-slate-500">
              El slug se genera automáticamente desde el nombre. Puedes editarlo manualmente.
            </p>
          </div>
        </div>

        <Button type="submit" loading={loading} className="mt-6 w-full">
          {loading ? 'Creando…' : 'Crear workspace'}
        </Button>
      </form>
    </div>
  );
}
