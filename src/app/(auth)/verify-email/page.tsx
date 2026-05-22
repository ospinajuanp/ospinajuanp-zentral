'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { StatusCard } from '@/components/ui';

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

  if (status === 'verifying') {
    return (
      <div className="rounded-md border border-slate-800 bg-slate-900 p-8 text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
        <p className="mt-4 text-sm text-slate-400">Verificando tu correo…</p>
      </div>
    );
  }

  return (
    <StatusCard
      type={status === 'success' ? 'success' : 'error'}
      message={message}
      action={status === 'success' ? { label: 'Iniciar sesión', href: '/login' } : undefined}
      secondaryAction={status === 'error' ? { label: 'Volver al inicio de sesión', href: '/login' } : undefined}
    />
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6">
      <div className="w-full max-w-sm text-center">
        <div className="mb-8 text-center">
          <a href="/" className="text-2xl font-bold tracking-tight text-white">
            Zentral
          </a>
        </div>

        <Suspense
          fallback={
            <div className="rounded-md border border-slate-800 bg-slate-900 p-8 text-center">
              <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
            </div>
          }
        >
          <VerifyEmailContent />
        </Suspense>

        <p className="mt-6 text-center text-xs text-slate-500">
          &copy; {new Date().getFullYear()} Zentral. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
}
