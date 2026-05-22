import Link from 'next/link';

export function Cta() {
  return (
    <section id="contacto" className="border-t border-slate-800 bg-slate-950 px-6 py-24">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          ¿Listo para empezar?
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-slate-400">
          Crea tu workspace, activa los módulos que necesitas y empieza a operar en minutos.
          Sin riesgos, sin compromisos.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/register"
            className="rounded-md bg-indigo-600 px-8 py-3.5 text-sm font-medium text-white shadow-lg transition-all hover:bg-indigo-700 hover:shadow-xl"
          >
            Crear mi workspace
          </Link>
          <a
            href="mailto:hola@zentral.dev"
            className="rounded-md border border-slate-700 px-8 py-3.5 text-sm font-medium text-slate-200 transition-all hover:bg-slate-800"
          >
            Contactar por email
          </a>
        </div>
      </div>
    </section>
  );
}
