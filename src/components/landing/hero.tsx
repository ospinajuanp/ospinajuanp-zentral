import Link from 'next/link';

export function Hero() {
  return (
    <section className="relative flex min-h-[90vh] items-center justify-center px-6 pt-24">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-100 via-white to-white" />

      <div className="mx-auto max-w-4xl text-center">
        <h1 className="text-5xl font-bold tracking-tight text-zinc-900 sm:text-6xl md:text-7xl">
          Tu ecosistema de
          <span className="text-zinc-500"> micro SaaS</span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-zinc-600">
          Zentral reúne herramientas modulares para optimizar procesos empresariales.
          Activa solo lo que necesitas, paga solo por lo que usas.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="#modulos"
            className="rounded-xl bg-zinc-900 px-8 py-3.5 text-sm font-semibold text-white shadow-lg transition-all hover:bg-zinc-800 hover:shadow-xl"
          >
            Explorar Módulos
          </Link>
          <Link
            href="/login"
            className="rounded-xl border border-zinc-300 bg-white px-8 py-3.5 text-sm font-semibold text-zinc-700 transition-all hover:bg-zinc-50"
          >
            Iniciar Sesión
          </Link>
        </div>

        <div className="mt-16 flex items-center justify-center gap-8 text-sm text-zinc-500">
          <span className="flex items-center gap-2">
            <svg className="h-4 w-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Sin instalación
          </span>
          <span className="flex items-center gap-2">
            <svg className="h-4 w-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Pago por módulo
          </span>
          <span className="flex items-center gap-2">
            <svg className="h-4 w-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Escalable
          </span>
        </div>
      </div>
    </section>
  );
}
