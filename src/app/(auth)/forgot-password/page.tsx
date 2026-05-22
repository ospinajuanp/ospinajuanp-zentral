'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setMessage('');
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
      setMessage(data.message);
    } catch {
      setError('Error de conexión. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link href="/" className="text-2xl font-bold tracking-tight text-white">
            Zentral
          </Link>
          <p className="mt-2 text-sm text-slate-400">Recupera tu contraseña</p>
        </div>

        {sent ? (
          <div className="rounded-md border border-slate-800 bg-slate-900 p-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10">
              <svg className="h-6 w-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-sm text-slate-300">{message}</p>
            <Link
              href="/login"
              className="mt-6 inline-block text-sm font-medium text-slate-200 underline underline-offset-2"
            >
              Volver al inicio de sesión
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="rounded-md border border-slate-800 bg-slate-900 p-8">
            {error && (
              <div className="mb-6 rounded-md bg-rose-500/10 px-4 py-3 text-sm text-rose-500">
                {error}
              </div>
            )}

            <p className="mb-6 text-sm text-slate-400">
              Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña.
            </p>

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
                className="mt-1 block w-full rounded-md border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-hidden"
                placeholder="admin@correo.com"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-6 w-full rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50"
            >
              {loading ? 'Enviando…' : 'Enviar enlace'}
            </button>

            <p className="mt-6 text-center text-xs text-slate-500">
              <Link href="/login" className="underline underline-offset-2 hover:text-slate-300">
                Volver al inicio de sesión
              </Link>
            </p>
          </form>
        )}

        <p className="mt-6 text-center text-xs text-slate-500">
          &copy; {new Date().getFullYear()} Zentral. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
}
