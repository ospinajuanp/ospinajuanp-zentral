import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-6">
      <div className="text-center">
        <p className="text-6xl font-bold text-slate-700">404</p>
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-white">
          Página no encontrada
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          La página que buscas no existe o fue movida.
        </p>
        <Link
          href="/"
          className="mt-8 inline-block rounded-md bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
