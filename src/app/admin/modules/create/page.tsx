'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { ErrorMessage, Button, StatusCard } from '@/components/ui';
import type { ModuleTier } from '@/types';

const moduleStatuses: { value: string; label: string }[] = [
  { value: 'active', label: 'Activo' },
  { value: 'inactive', label: 'Inactivo' },
  { value: 'coming_soon', label: 'Próximamente' },
];

export default function CreateModulePage() {
  const [key, setKey] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tier, setTier] = useState<ModuleTier>('free');
  const [status, setStatus] = useState('active');
  const [defaultQuota, setDefaultQuota] = useState(100);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState(false);

  function handleNameChange(value: string) {
    setName(value);
    setKey(value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/admin/modules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, name, description, tier, status, defaultQuota: Number(defaultQuota) }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Error al crear módulo');
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
          message={`Módulo "${name}" creado correctamente.`}
          action={{ label: 'Volver a módulos', href: '/admin/modules' }}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg">
      <Link href="/admin/modules" className="text-sm text-slate-400 hover:text-slate-300">
        ← Volver a Módulos
      </Link>

      <h1 className="mt-4 text-2xl font-bold tracking-tight text-white">Nuevo módulo</h1>
      <p className="mt-1 text-sm text-slate-400">
        Registra un nuevo módulo en el catálogo de Zentral.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 rounded-md border border-slate-800 bg-slate-900 p-6">
        {error && <ErrorMessage message={error} />}

        <div className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-400">
              Nombre del módulo
            </label>
            <input
              id="name"
              type="text"
              required
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              placeholder="TransferCheck"
            />
          </div>

          <div>
            <label htmlFor="key" className="block text-sm font-medium text-slate-400">
              Key
            </label>
            <input
              id="key"
              type="text"
              required
              value={key}
              onChange={(e) => setKey(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white font-mono placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              placeholder="transfercheck"
            />
            <p className="mt-1 text-xs text-slate-500">Se genera automáticamente desde el nombre.</p>
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
              placeholder="Descripción del módulo"
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
            <p className="mt-1 text-xs text-slate-500">0 = consultas ilimitadas.</p>
          </div>
        </div>

        <Button type="submit" loading={loading} className="mt-6 w-full">
          {loading ? 'Creando…' : 'Crear módulo'}
        </Button>
      </form>
    </div>
  );
}
