'use client';

import { useState, useEffect, FormEvent } from 'react';
import Link from 'next/link';
import { ErrorMessage, Button } from '@/components/ui';

interface WorkspaceItem {
  _id: string;
  name: string;
  slug: string;
  isActive: boolean;
  owner?: { _id: string; name: string; email: string } | null;
}

export default function WorkspacesPage() {
  const [workspaces, setWorkspaces] = useState<WorkspaceItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [showCreate, setShowCreate] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createSlug, setCreateSlug] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createSuccess, setCreateSuccess] = useState('');

  function load() {
    setLoading(true);
    fetch('/api/admin/workspaces')
      .then((res) => res.json())
      .then((data) => {
        if (data.workspaces) setWorkspaces(data.workspaces);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setCreateError('');
    setCreating(true);

    try {
      const res = await fetch('/api/admin/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: createName, slug: createSlug }),
      });

      const data = await res.json();

      if (!res.ok) {
        setCreateError(data.error ?? 'Error al crear');
        return;
      }

      setCreateSuccess(`Workspace "${createName}" creado correctamente.`);
      setCreateName('');
      setCreateSlug('');
      setShowCreate(false);
      load();
    } catch {
      setCreateError('Error de conexión');
    } finally {
      setCreating(false);
    }
  }

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Workspaces</h1>
          <p className="mt-1 text-sm text-slate-400">
            {workspaces.length} workspace{workspaces.length !== 1 ? 's' : ''} registrado
            {workspaces.length !== 1 ? 's' : ''}.
          </p>
        </div>
        <button
          onClick={() => {
            setShowCreate(!showCreate);
            setCreateError('');
            setCreateSuccess('');
          }}
          className="w-fit rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          + Nuevo workspace
        </button>
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} className="mt-6 rounded-md border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-lg font-semibold text-white">Crear workspace</h2>

          {createError && <ErrorMessage message={createError} />}
          {createSuccess && (
            <div className="mb-4 rounded-md border border-emerald-800 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-500">
              {createSuccess}
            </div>
          )}

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="createName" className="block text-sm font-medium text-slate-400">
                Nombre
              </label>
              <input
                id="createName"
                type="text"
                required
                value={createName}
                onChange={(e) => {
                  setCreateName(e.target.value);
                  setCreateSlug(e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
                }}
                className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                placeholder="Mi Workspace"
              />
            </div>
            <div>
              <label htmlFor="createSlug" className="block text-sm font-medium text-slate-400">
                Slug
              </label>
              <input
                id="createSlug"
                type="text"
                required
                value={createSlug}
                onChange={(e) => setCreateSlug(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white font-mono placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                placeholder="mi-workspace"
              />
            </div>
          </div>

          <Button type="submit" loading={creating} className="mt-4 w-full sm:w-auto">
            {creating ? 'Creando…' : 'Crear workspace'}
          </Button>
        </form>
      )}

      {loading ? (
        <div className="mt-8 flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
        </div>
      ) : (
        <div className="mt-8 overflow-hidden rounded-md border border-slate-800 bg-slate-900 sm:overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="max-sm:hidden">
              <tr className="border-b border-slate-800 bg-slate-950 text-left">
                <th className="px-6 py-3 font-medium text-slate-400">Nombre</th>
                <th className="px-6 py-3 font-medium text-slate-400">Slug</th>
                <th className="px-6 py-3 font-medium text-slate-400">Admin</th>
                <th className="px-6 py-3 font-medium text-slate-400">Estado</th>
                <th className="px-6 py-3 font-medium text-slate-400">Acción</th>
              </tr>
            </thead>
            <tbody>
              {workspaces.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    No hay workspaces registrados.
                  </td>
                </tr>
              ) : (
                workspaces.map((ws) => (
                  <tr key={ws._id} className="block border-b border-slate-800 p-4 sm:table-row sm:border-none sm:p-0">
                    <td className="block sm:table-cell sm:px-6 sm:py-4">
                      <span className="block text-xs text-slate-500 max-sm:mb-0.5 sm:hidden">Nombre</span>
                      <span className="font-medium text-white">{ws.name}</span>
                    </td>
                    <td className="block sm:table-cell sm:px-6 sm:py-4">
                      <span className="block text-xs text-slate-500 max-sm:mb-0.5 sm:hidden">Slug</span>
                      <span className="font-mono text-slate-400">{ws.slug}</span>
                    </td>
                    <td className="block sm:table-cell sm:px-6 sm:py-4">
                      <span className="block text-xs text-slate-500 max-sm:mb-0.5 sm:hidden">Admin</span>
                      <span className="text-slate-400">{ws.owner?.name ?? '—'}</span>
                    </td>
                    <td className="block sm:table-cell sm:px-6 sm:py-4">
                      <span className="block text-xs text-slate-500 max-sm:mb-0.5 sm:hidden">Estado</span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          ws.isActive
                            ? 'bg-emerald-500/10 text-emerald-500'
                            : 'bg-rose-500/10 text-rose-500'
                        }`}
                      >
                        {ws.isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="block sm:table-cell sm:px-6 sm:py-4">
                      <span className="block text-xs text-slate-500 max-sm:mb-0.5 sm:hidden">Acción</span>
                      <Link
                        href={`/admin/workspaces/${ws._id}`}
                        className="text-sm font-medium text-indigo-400 underline underline-offset-2 hover:text-white"
                      >
                        Editar
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
