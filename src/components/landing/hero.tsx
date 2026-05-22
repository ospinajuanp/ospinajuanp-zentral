import Link from 'next/link';

export function Hero() {
  return (
    <section className="relative flex min-h-[90vh] items-center justify-center bg-slate-950 px-6 pt-24">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950" />

      <div className="mx-auto max-w-4xl text-center">
        <h1 className="text-5xl font-bold tracking-tight text-white sm:text-6xl md:text-7xl">
          Tu ecosistema de
          <span className="text-indigo-400"> micro SaaS</span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-400">
          Zentral reúne herramientas modulares para optimizar procesos empresariales.
          Activa solo lo que necesitas, paga solo por lo que usas.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="#modulos"
            className="rounded-md bg-indigo-600 px-8 py-3.5 text-sm font-medium text-white shadow-lg transition-all hover:bg-indigo-700 hover:shadow-xl"
          >
            Explorar Módulos
          </Link>
          <Link
            href="/register"
            className="rounded-md border border-slate-700 px-8 py-3.5 text-sm font-medium text-slate-200 transition-all hover:bg-slate-800"
          >
            Empezar gratis
          </Link>
        </div>

        <div className="mt-16 flex items-center justify-center gap-8 text-sm text-slate-400">
          <span className="flex items-center gap-2">
            <svg className="h-4 w-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Sin instalación
          </span>
          <span className="flex items-center gap-2">
            <svg className="h-4 w-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Pago por módulo
          </span>
          <span className="flex items-center gap-2">
            <svg className="h-4 w-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Escalable
          </span>
        </div>
      </div>
    </section>
  );
}
