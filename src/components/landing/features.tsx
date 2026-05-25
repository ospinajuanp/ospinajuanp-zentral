export function Features() {
  return (
    <section id="que-es" aria-labelledby="features-heading" className="border-t border-slate-800 bg-slate-950 px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <h2 id="features-heading" className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          ¿Que es Zentral?
        </h2>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-slate-400">
          Zentral es un estudio de micro SaaS modular. Cada modulo resuelve un problema
          especifico de negocio y puede activarse de forma independiente. Todo desde un
          mismo panel, con un solo inicio de sesion.
        </p>

        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              title: 'Modular',
              description: 'Activa solo los modulos que necesitas. Sin bloat, sin pagar por lo que no usas.',
              icon: '🧩',
            },
            {
              title: 'Centralizado',
              description: 'Un solo panel para gestionar todos tus modulos, usuarios y suscripciones.',
              icon: '🎯',
            },
            {
              title: 'Escalable',
              description: 'De 1 a 100 usuarios. Los modulos crecen con tu negocio sin migraciones dolorosas.',
              icon: '📈',
            },
            {
              title: 'Seguro',
              description: 'Roles y permisos granulares. Cada usuario ve solo lo que necesita.',
              icon: '🔒',
            },
            {
              title: 'Pago flexible',
              description: 'Modulos free y premium. Empieza gratis, actualiza cuando lo necesites.',
              icon: '💳',
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="flex h-full flex-col rounded-md border border-slate-800 bg-slate-900 p-8 transition-shadow hover:shadow-indigo-500/10"
            >
              <span className="text-3xl" aria-hidden="true">{feature.icon}</span>
              <h3 className="mt-4 text-lg font-semibold text-white">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
