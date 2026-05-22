'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AuthLayout, InputField, ErrorMessage, Button } from '@/components/ui';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    fetch('/api/auth/session')
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated) {
          router.push(data.role === 'superadmin' ? '/admin' : '/dashboard');
        } else {
          setChecking(false);
        }
      })
      .catch(() => setChecking(false));
  }, [router]);

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950" />
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Error al iniciar sesión');
        return;
      }

      router.push(data.redirect);
    } catch {
      setError('Error de conexión. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout>
      <p className="mb-6 text-center text-sm text-slate-400">
        Inicia sesión en tu workspace
      </p>

      <form onSubmit={handleSubmit} className="rounded-md border border-slate-800 bg-slate-900 p-8">
        {error && <ErrorMessage message={error} />}

        <div className="space-y-4">
          <InputField
            id="email"
            label="Email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@correo.com"
          />

          <div>
            <InputField
              id="password"
              label="Contraseña"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              showPasswordToggle
            />
          </div>
        </div>

        <div className="mt-2 text-right">
          <Link
            href="/forgot-password"
            className="text-xs text-slate-500 underline underline-offset-2 hover:text-slate-300"
          >
            ¿Olvidaste tu contraseña?
          </Link>
        </div>

        <Button
          type="submit"
          loading={loading}
          className="mt-6 w-full"
        >
          {loading ? 'Iniciando sesión…' : 'Iniciar Sesión'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-400">
        ¿No tienes cuenta?{' '}
        <Link href="/register" className="font-medium text-slate-200 underline underline-offset-2">
          Regístrate gratis
        </Link>
      </p>
    </AuthLayout>
  );
}
