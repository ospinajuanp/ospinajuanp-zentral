export default function ModulesError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6">
      <div className="text-center">
        <h2 className="text-lg font-semibold text-white">Error al cargar el módulo</h2>
        <p className="mt-2 text-sm text-slate-400">
          Ocurrió un error inesperado. Por favor, inténtalo de nuevo.
        </p>
        <button
          onClick={reset}
          className="mt-6 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Reintentar
        </button>
      </div>
    </div>
  );
}
