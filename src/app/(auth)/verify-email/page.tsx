'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('No se encontró el token de verificación en la URL.');
      return;
    }

    async function verify() {
      try {
        const res = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        const data = await res.json();

        if (res.ok) {
          setStatus('success');
          setMessage(data.message);
        } else {
          setStatus('error');
          setMessage(data.error ?? 'Error al verificar el correo.');
        }
      } catch {
        setStatus('error');
        setMessage('Error de conexión. Intenta de nuevo.');
      }
    }

    verify();
  }, [token]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6">
      <div className="w-full max-w-sm text-center">
        <Link href="/" className="text-2xl font-bold tracking-tight text-white">
          Zentral
        </Link>

        <div className="mt-8 rounded-md border border-slate-800 bg-slate-900 p-8">
          {status === 'verifying' && (
            <div>
              <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
              <p className="mt-4 text-sm text-slate-400">Verificando tu correo…</p>
            </div>
          )}

          {status === 'success' && (
            <div>
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10">
                <svg className="h-6 w-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-sm text-slate-300">{message}</p>
              <Link
                href="/login"
                className="mt-6 inline-block rounded-md bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
              >
                Iniciar sesión
              </Link>
            </div>
          )}

          {status === 'error' && (
            <div>
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/10">
                <svg className="h-6 w-6 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <p className="text-sm text-rose-500">{message}</p>
              <Link
                href="/login"
                className="mt-6 inline-block rounded-md border border-slate-700 px-6 py-2.5 text-sm font-medium text-slate-200 transition-colors hover:bg-slate-800"
              >
                Volver al inicio de sesión
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-950">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
