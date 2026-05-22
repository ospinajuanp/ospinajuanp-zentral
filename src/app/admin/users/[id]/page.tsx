'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ErrorMessage, Button, StatusCard, ConfirmDialog } from '@/components/ui';

interface UserData {
  _id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  workspace?: { _id: string; name: string } | string | null;
}

export default function UserDetailPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;

  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('hijo');
  const [isActive, setIsActive] = useState(true);
  const [password, setPassword] = useState('');

  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/users/${userId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setUser(data.user);
          setName(data.user.name);
          setEmail(data.user.email);
          setRole(data.user.role);
          setIsActive(data.user.isActive);
        } else {
          setError('Usuario no encontrado');
        }
      })
      .catch(() => setError('Error al cargar usuario'))
      .finally(() => setLoading(false));
  }, [userId]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      const body: Record<string, unknown> = { name, email, role, isActive };
      if (password) body.password = password;

      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Error al actualizar');
        return;
      }

      setSuccess('Usuario actualizado correctamente');
      setPassword('');
    } catch {
      setError('Error de conexión');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' });
      if (res.ok) {
        router.push('/admin/users');
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

  if (!user) {
    return (
      <StatusCard
        type="error"
        message={error || 'Usuario no encontrado'}
        action={{ label: 'Volver a usuarios', href: '/admin/users' }}
      />
    );
  }

  return (
    <div>
      <Link href="/admin/users" className="text-sm text-slate-400 hover:text-slate-300">
        ← Volver a Usuarios
      </Link>

      <h1 className="mt-4 text-2xl font-bold tracking-tight text-white">Editar usuario</h1>

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
              <label htmlFor="email" className="block text-sm font-medium text-slate-400">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-slate-400">
                Rol
              </label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
              >
                <option value="hijo">Usuario</option>
                <option value="admin">Admin</option>
                <option value="superadmin">SuperAdmin</option>
              </select>
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
                Usuario activo
              </label>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-400">
                Nueva contraseña <span className="text-slate-500">(dejar vacío para mantener)</span>
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="mt-6 flex items-center gap-3">
            <Button type="submit" loading={saving}>
              {saving ? 'Guardando…' : 'Guardar cambios'}
            </Button>
          </div>
        </form>

        <div className="rounded-md border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-lg font-semibold text-white">Zona de peligro</h2>
          <p className="mt-2 text-sm text-slate-400">
            Eliminar este usuario es una acción irreversible. Todos sus datos serán eliminados permanentemente.
          </p>

          <button
            onClick={() => setDeleteConfirm(true)}
            className="mt-4 rounded-md border border-rose-800 bg-rose-500/10 px-4 py-2 text-sm font-medium text-rose-400 transition-colors hover:bg-rose-500/20"
          >
            Eliminar usuario
          </button>

          <ConfirmDialog
            open={deleteConfirm}
            title="Eliminar usuario"
            message="¿Estás seguro de eliminar a este usuario? Esta acción es irreversible."
            itemName={user.name}
            loading={deleting}
            onConfirm={handleDelete}
            onCancel={() => setDeleteConfirm(false)}
          />
        </div>
      </div>
    </div>
  );
}
