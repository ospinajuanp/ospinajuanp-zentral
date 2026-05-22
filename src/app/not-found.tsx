import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-6">
      <div className="text-center">
        <p className="text-6xl font-bold text-zinc-300">404</p>
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-zinc-900">
          Página no encontrada
        </h1>
        <p className="mt-2 text-sm text-zinc-600">
          La página que buscas no existe o fue movida.
        </p>
        <Link
          href="/"
          className="mt-8 inline-block rounded-xl bg-zinc-900 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-zinc-800"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
