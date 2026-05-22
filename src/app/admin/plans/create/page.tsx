'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ErrorMessage, Button, StatusCard } from '@/components/ui';

export default function CreatePlanPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [monthlyPrice, setMonthlyPrice] = useState('');
  const [description, setDescription] = useState('');
  const [featuresText, setFeaturesText] = useState('');
  const [cta, setCta] = useState('Empezar');
  const [highlighted, setHighlighted] = useState(false);
  const [sortOrder, setSortOrder] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const features = featuresText
      .split('\n')
      .map((f) => f.trim())
      .filter(Boolean);

    try {
      const res = await fetch('/api/admin/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          price,
          monthlyPrice: monthlyPrice ? Number(monthlyPrice) : null,
          description,
          features,
          cta,
          highlighted,
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
    <div className="mx-auto max-w-lg">
      <Link href="/admin/plans" className="text-sm text-slate-400 hover:text-slate-300">
        ← Volver a Planes
      </Link>

      <h1 className="mt-4 text-2xl font-bold tracking-tight text-white">Nuevo plan</h1>
      <p className="mt-1 text-sm text-slate-400">
        Crea un nuevo plan de precios para Zentral.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 rounded-md border border-slate-800 bg-slate-900 p-6">
        {error && <ErrorMessage message={error} />}

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
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
                placeholder="Premium"
              />
            </div>
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-slate-400">
                Precio (texto)
              </label>
              <input
                id="price"
                type="text"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                placeholder="$12 o A medida"
              />
            </div>
          </div>

          <div>
            <label htmlFor="monthlyPrice" className="block text-sm font-medium text-slate-400">
              Precio mensual (número, opcional)
            </label>
            <input
              id="monthlyPrice"
              type="number"
              step="0.01"
              value={monthlyPrice}
              onChange={(e) => setMonthlyPrice(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              placeholder="12"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-slate-400">
              Descripción
            </label>
            <input
              id="description"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              placeholder="Para equipos que necesitan más."
            />
          </div>

          <div>
            <label htmlFor="features" className="block text-sm font-medium text-slate-400">
              Características (una por línea)
            </label>
            <textarea
              id="features"
              value={featuresText}
              onChange={(e) => setFeaturesText(e.target.value)}
              rows={5}
              className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              placeholder="5 usuarios&#10;500 consultas / mes&#10;Soporte por email"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="cta" className="block text-sm font-medium text-slate-400">
                Texto del botón
              </label>
              <input
                id="cta"
                type="text"
                value={cta}
                onChange={(e) => setCta(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="sortOrder" className="block text-sm font-medium text-slate-400">
                Orden
              </label>
              <input
                id="sortOrder"
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(Number(e.target.value))}
                className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input
              id="highlighted"
              type="checkbox"
              checked={highlighted}
              onChange={(e) => setHighlighted(e.target.checked)}
              className="h-4 w-4 rounded border-slate-700 bg-slate-800 text-indigo-500 focus:ring-indigo-500"
            />
            <label htmlFor="highlighted" className="text-sm font-medium text-slate-400">
              Plan destacado (más popular)
            </label>
          </div>
        </div>

        <Button type="submit" loading={loading} className="mt-6 w-full">
          {loading ? 'Creando…' : 'Crear plan'}
        </Button>
      </form>
    </div>
  );
}
