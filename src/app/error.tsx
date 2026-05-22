'use client';

import Link from 'next/link';

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-6">
      <div className="text-center">
        <p className="text-6xl font-bold text-zinc-300">500</p>
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-zinc-900">
          Error del servidor
        </h1>
        <p className="mt-2 text-sm text-zinc-600">
          Algo salió mal. Intenta de nuevo más tarde.
        </p>
        <div className="mt-8 flex items-center justify-center gap-4">
          <button
            onClick={reset}
            className="rounded-xl bg-zinc-900 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-zinc-800"
          >
            Reintentar
          </button>
          <Link
            href="/"
            className="rounded-xl border border-zinc-300 px-6 py-2.5 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-100"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
