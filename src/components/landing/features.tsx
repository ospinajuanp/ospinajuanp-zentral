export function Features() {
  return (
    <section id="que-es" className="border-t border-zinc-100 px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
          ¿Qué es Zentral?
        </h2>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-zinc-600">
          Zentral es un estudio de micro SaaS modular. Cada módulo resuelve un problema
          específico de negocio y puede activarse de forma independiente. Todo desde un
          mismo panel, con un solo inicio de sesión.
        </p>

        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              title: 'Modular',
              description: 'Activa solo los módulos que necesitas. Sin bloat, sin pagar por lo que no usas.',
              icon: '🧩',
            },
            {
              title: 'Centralizado',
              description: 'Un solo panel para gestionar todos tus módulos, usuarios y suscripciones.',
              icon: '🎯',
            },
            {
              title: 'Escalable',
              description: 'De 1 a 100 usuarios. Los módulos crecen con tu negocio sin migraciones dolorosas.',
              icon: '📈',
            },
            {
              title: 'Seguro',
              description: 'Roles y permisos granulares. Cada usuario ve solo lo que necesita.',
              icon: '🔒',
            },
            {
              title: 'Multi-empresa',
              description: 'Un SuperAdmin puede gestionar múltiples workspaces desde un solo lugar.',
              icon: '🏢',
            },
            {
              title: 'Pago flexible',
              description: 'Módulos free y premium. Empieza gratis, actualiza cuando lo necesites.',
              icon: '💳',
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="rounded-2xl border border-zinc-200 bg-white p-8 transition-shadow hover:shadow-lg"
            >
              <span className="text-3xl">{feature.icon}</span>
              <h3 className="mt-4 text-lg font-semibold text-zinc-900">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
