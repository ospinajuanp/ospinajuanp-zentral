'use client';

import { useState, FormEvent, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AuthLayout, InputField, ErrorMessage, Button, StatusCard } from '@/components/ui';

export default function RegisterPage() {
  const searchParams = useSearchParams();
  const planId = searchParams.get('plan');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);

  const suggestedWorkspace = useMemo(
    () => (name.trim() ? `Workspace de ${name.trim()}` : ''),
    [name]
  );

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          password,
          companyName: companyName || null,
          planId: planId || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Error al registrarse');
        return;
      }

      setRegistered(true);
    } catch {
      setError('Error de conexión. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout>
      <p className="mb-6 text-center text-sm text-slate-400">
        Crea tu workspace gratis
      </p>

      {registered ? (
        <StatusCard
          type="success"
          message="Cuenta creada correctamente. Revisa tu bandeja de entrada para verificar tu correo electrónico."
          action={{ label: 'Ir a iniciar sesión', href: '/login' }}
        />
      ) : (
        <form
          onSubmit={handleSubmit}
          className="rounded-md border border-slate-800 bg-slate-900 p-8"
        >
          {error && <ErrorMessage message={error} />}

          {planId && (
            <div className="mb-4 rounded-md border border-indigo-800 bg-indigo-500/10 px-4 py-2 text-xs text-indigo-400">
              Estás registrando con un plan seleccionado. Una vez verifiques tu email, un administrador activará tu cuenta según el plan.
            </div>
          )}

          <div className="space-y-4">
            <InputField
              id="name"
              label="Nombre completo"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tu nombre"
            />

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
                id="company"
                label="Nombre de la empresa"
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder={suggestedWorkspace || 'Mi Empresa S.A.S.'}
              />
              {!companyName && suggestedWorkspace && (
                <p className="mt-1 text-xs text-slate-500">
                  Si lo dejas vacío se usará &ldquo;{suggestedWorkspace}&rdquo;
                </p>
              )}
            </div>

            <InputField
              id="password"
              label="Contraseña"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              showPasswordToggle
            />
          </div>

          <Button
            type="submit"
            loading={loading}
            className="mt-6 w-full"
          >
            {loading ? 'Creando workspace…' : 'Crear workspace gratis'}
          </Button>

          <p className="mt-6 text-center text-sm text-slate-400">
            ¿Ya tienes cuenta?{' '}
            <Link href="/login" className="font-medium text-slate-200 underline underline-offset-2">
              Inicia sesión
            </Link>
          </p>
        </form>
      )}
    </AuthLayout>
  );
}