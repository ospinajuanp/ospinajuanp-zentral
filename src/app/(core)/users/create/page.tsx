'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToastContext } from '@/contexts/toast-context';
import { Button } from '@/components/ui';

export default function CreateUserPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const toast = useToastContext();
  const router = useRouter();
  const [role, setRole] = useState('operador');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? 'Error al crear usuario');
        return;
      }

      toast.success('Usuario creado correctamente');
      router.push('/users');
    } catch {
      toast.error('Error de conexión');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <Link href="/users" className="text-sm text-slate-400 hover:text-slate-300">
        ← Volver a Usuarios
      </Link>

      <h1 className="mt-4 text-2xl font-bold tracking-tight text-white">Nuevo usuario</h1>
      <p className="mt-1 text-sm text-slate-400">
        Crea un usuario con acceso a los módulos de tu workspace.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 rounded-md border border-slate-800 bg-slate-900 p-6">
        <div className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-400">
              Nombre completo
            </label>
            <input
              id="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              placeholder="Nombre del usuario"
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
              placeholder="usuario@correo.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-400">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              placeholder="Mínimo 6 caracteres"
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
              <option value="operador">Operador — acceso solo a módulos asignados</option>
              <option value="admin">Admin — puede gestionar usuarios y workspace</option>
            </select>
            <p className="mt-1 text-xs text-slate-500">
              {role === 'operador'
                ? 'Los usuarios solo ven los módulos que tiene su workspace.'
                : 'Los admins pueden crear y gestionar usuarios.'}
            </p>
          </div>
        </div>

        <Button type="submit" loading={loading} className="mt-6 w-full">
          {loading ? 'Creando…' : 'Crear usuario'}
        </Button>
      </form>
    </div>
  );
}
