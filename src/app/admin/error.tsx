'use client';

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <p className="text-5xl font-bold text-zinc-300">500</p>
      <h2 className="mt-4 text-xl font-bold tracking-tight text-zinc-900">
        Error del servidor
      </h2>
      <p className="mt-2 text-sm text-zinc-600">
        {error.message || 'Algo salió mal al cargar esta sección.'}
      </p>
      <button
        onClick={reset}
        className="mt-8 rounded-xl bg-zinc-900 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-zinc-800"
      >
        Reintentar
      </button>
    </div>
  );
}
