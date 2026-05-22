'use client';

import Link from 'next/link';

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-6">
      <div className="text-center">
        <p className="text-6xl font-bold text-slate-700">500</p>
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-white">
          Error del servidor
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Algo salió mal. Intenta de nuevo más tarde.
        </p>
        <div className="mt-8 flex items-center justify-center gap-4">
          <button
            onClick={reset}
            className="rounded-md bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
          >
            Reintentar
          </button>
          <Link
            href="/"
            className="rounded-md border border-slate-700 px-6 py-2.5 text-sm font-medium text-slate-200 transition-colors hover:bg-slate-800"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
