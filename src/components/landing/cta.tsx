import Link from 'next/link';

export function Cta() {
  return (
    <section id="contacto" className="border-t border-zinc-100 px-6 py-24">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
          ¿Listo para empezar?
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-zinc-600">
          Crea tu workspace, activa los módulos que necesitas y empieza a operar en minutos.
          Sin riesgos, sin compromisos.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/register"
            className="rounded-xl bg-zinc-900 px-8 py-3.5 text-sm font-semibold text-white shadow-lg transition-all hover:bg-zinc-800 hover:shadow-xl"
          >
            Crear mi workspace
          </Link>
          <a
            href="mailto:hola@zentral.dev"
            className="rounded-xl border border-zinc-300 bg-white px-8 py-3.5 text-sm font-semibold text-zinc-700 transition-all hover:bg-zinc-50"
          >
            Contactar por email
          </a>
        </div>
      </div>
    </section>
  );
}
