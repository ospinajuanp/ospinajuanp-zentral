'use client';

import { useState, FormEvent, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { InputField, ErrorMessage, Button, StatusCard } from '@/components/ui';
import { AuthLayout } from '@/components/ui/auth-layout';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (password !== confirm) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Error al restablecer la contraseña');
        return;
      }

      setSuccess(true);
    } catch {
      setError('Error de conexión. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <StatusCard
        type="error"
        message="Enlace inválido. No se encontró el token de recuperación."
        action={{ label: 'Solicitar nuevo enlace', href: '/forgot-password' }}
      />
    );
  }

  if (success) {
    return (
      <StatusCard
        type="success"
        message="Contraseña actualizada correctamente."
        action={{ label: 'Iniciar sesión', href: '/login' }}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-md border border-slate-800 bg-slate-900 p-8">
      {error && <ErrorMessage message={error} />}

      <p className="mb-6 text-sm text-slate-400">
        Ingresa tu nueva contraseña.
      </p>

      <div className="space-y-4">
        <InputField
          id="password"
          label="Nueva contraseña"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          showPasswordToggle
        />

        <InputField
          id="confirm"
          label="Confirmar contraseña"
          type="password"
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="••••••••"
          showPasswordToggle
        />
      </div>

      <Button
        type="submit"
        loading={loading}
        className="mt-6 w-full"
      >
        {loading ? 'Actualizando…' : 'Restablecer contraseña'}
      </Button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthLayout>
      <p className="mb-6 text-center text-sm text-slate-400">
        Restablece tu contraseña
      </p>

      <Suspense
        fallback={
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
          </div>
        }
      >
        <ResetPasswordForm />
      </Suspense>
    </AuthLayout>
  );
}
