'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { AuthLayout, InputField, ErrorMessage, Button, StatusCard } from '@/components/ui';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Error al enviar la solicitud');
        return;
      }

      setSent(true);
    } catch {
      setError('Error de conexión. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout>
      <p className="mb-6 text-center text-sm text-slate-400">
        Recupera tu contraseña
      </p>

      {sent ? (
        <StatusCard
          type="success"
          message="Si el correo está registrado, recibirás un enlace para restablecer tu contraseña."
          secondaryAction={{ label: 'Volver al inicio de sesión', href: '/login' }}
        />
      ) : (
        <form
          onSubmit={handleSubmit}
          className="rounded-md border border-slate-800 bg-slate-900 p-8"
        >
          {error && <ErrorMessage message={error} />}

          <p className="mb-6 text-sm text-slate-400">
            Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña.
          </p>

          <InputField
            id="email"
            label="Email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@correo.com"
          />

          <Button
            type="submit"
            loading={loading}
            className="mt-6 w-full"
          >
            {loading ? 'Enviando…' : 'Enviar enlace'}
          </Button>

          <p className="mt-6 text-center text-xs text-slate-500">
            <Link href="/login" className="underline underline-offset-2 hover:text-slate-300">
              Volver al inicio de sesión
            </Link>
          </p>
        </form>
      )}
    </AuthLayout>
  );
}
