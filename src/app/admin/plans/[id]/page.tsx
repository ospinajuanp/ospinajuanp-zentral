'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ErrorMessage, Button, StatusCard, ConfirmDialog } from '@/components/ui';

export default function EditPlanPage() {
  const router = useRouter();
  const params = useParams();
  const planId = params.id as string;

  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [monthlyPrice, setMonthlyPrice] = useState('');
  const [description, setDescription] = useState('');
  const [featuresText, setFeaturesText] = useState('');
  const [cta, setCta] = useState('');
  const [highlighted, setHighlighted] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [sortOrder, setSortOrder] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/plans/${planId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.plan) {
          const p = data.plan;
          setName(p.name);
          setPrice(p.price);
          setMonthlyPrice(p.monthlyPrice !== null ? String(p.monthlyPrice) : '');
          setDescription(p.description ?? '');
          setFeaturesText((p.features ?? []).join('\n'));
          setCta(p.cta ?? '');
          setHighlighted(p.highlighted ?? false);
          setIsActive(p.isActive ?? true);
          setSortOrder(p.sortOrder ?? 0);
        } else {
          setError('Plan no encontrado');
        }
      })
      .catch(() => setError('Error al cargar'))
      .finally(() => setLoading(false));
  }, [planId]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    const features = featuresText
      .split('\n')
      .map((f) => f.trim())
      .filter(Boolean);

    try {
      const res = await fetch(`/api/admin/plans/${planId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          price,
          monthlyPrice: monthlyPrice ? Number(monthlyPrice) : null,
          description,
          features,
          cta,
          highlighted,
          isActive,
          sortOrder: Number(sortOrder),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Error al actualizar');
        return;
      }

      setSuccess('Plan actualizado correctamente');
    } catch {
      setError('Error de conexión');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/plans/${planId}`, { method: 'DELETE' });
      if (res.ok) {
        router.push('/admin/plans');
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
      <Link href="/admin/plans" className="text-sm text-slate-400 hover:text-slate-300">
        ← Volver a Planes
      </Link>

      <h1 className="mt-4 text-2xl font-bold tracking-tight text-white">Editar plan</h1>
      <p className="mt-1 text-sm text-slate-400">
        {name} — Configuración del plan de precios.
      </p>

      {error && <ErrorMessage message={error} />}
      {success && (
        <div className="mb-4 rounded-md border border-emerald-800 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-500">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-8 rounded-md border border-slate-800 bg-slate-900 p-6">
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
              Plan destacado
            </label>
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
              Plan activo
            </label>
          </div>
        </div>

        <Button type="submit" loading={saving} className="mt-6 w-full">
          {saving ? 'Guardando…' : 'Guardar cambios'}
        </Button>
      </form>

      <div className="mt-6 rounded-md border border-slate-800 bg-slate-900 p-6">
        <h2 className="text-lg font-semibold text-white">Zona de peligro</h2>
        <p className="mt-2 text-sm text-slate-400">
          Eliminar este plan lo quitará del catálogo de precios en la landing page.
        </p>
        <button
          onClick={() => setDeleteConfirm(true)}
          className="mt-4 rounded-md border border-rose-800 bg-rose-500/10 px-4 py-2 text-sm font-medium text-rose-400 transition-colors hover:bg-rose-500/20"
        >
          Eliminar plan
        </button>
        <ConfirmDialog
          open={deleteConfirm}
          title="Eliminar plan"
          message="¿Estás seguro de eliminar este plan de precios?"
          itemName={name}
          loading={deleting}
          onConfirm={handleDelete}
          onCancel={() => setDeleteConfirm(false)}
        />
      </div>
    </div>
  );
}
