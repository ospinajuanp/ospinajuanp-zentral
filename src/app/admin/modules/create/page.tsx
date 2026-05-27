'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui';
import { useToastContext } from '@/contexts/toast-context';
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
  const [visible, setVisible] = useState(true);
  const toast = useToastContext();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  function handleNameChange(value: string) {
    setName(value);
    setKey(value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/admin/modules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, name, description, tier, status, defaultQuota: Number(defaultQuota), visible }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? 'Error al crear modulo');
        return;
      }

      toast.success(`Modulo "${name}" creado correctamente.`);
      router.push('/admin/modules');
    } catch {
      toast.error('Error de conexión');
    } finally {
      setLoading(false);
    }
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
