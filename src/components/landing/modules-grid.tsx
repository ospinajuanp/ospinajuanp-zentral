const modules = [
  {
    name: 'TransferCheck',
    slug: 'transfercheck',
    description: 'Verificación y validación de transferencias bancarias en tiempo real.',
    status: 'Activo',
    tier: 'free' as const,
  },
  {
    name: 'Antecedentes',
    slug: 'antecedentes',
    description: 'Consulta de antecedentes judiciales, policiales y comerciales.',
    status: 'Próximamente',
    tier: 'premium' as const,
  },
  {
    name: 'Facturación',
    slug: 'facturacion',
    description: 'Gestión de facturación electrónica y seguimiento de pagos.',
    status: 'Próximamente',
    tier: 'premium' as const,
  },
  {
    name: 'CRM',
    slug: 'crm',
    description: 'Gestión de relaciones con clientes y pipeline de ventas.',
    status: 'Próximamente',
    tier: 'premium' as const,
  },
];

export function ModulesGrid() {
  return (
    <section id="modulos" className="border-t border-zinc-100 bg-zinc-50 px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
            Módulos disponibles
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-zinc-600">
            Cada módulo es independiente. Actívalos según las necesidades de tu negocio.
          </p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {modules.map((mod) => (
            <div
              key={mod.slug}
              className="flex flex-col rounded-2xl border border-zinc-200 bg-white p-6 transition-shadow hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    mod.tier === 'free'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-zinc-100 text-zinc-600'
                  }`}
                >
                  {mod.tier === 'free' ? 'Gratis' : 'Premium'}
                </span>
                <span
                  className={`text-xs font-medium ${
                    mod.status === 'Activo' ? 'text-green-600' : 'text-zinc-400'
                  }`}
                >
                  {mod.status}
                </span>
              </div>

              <h3 className="mt-4 text-lg font-semibold text-zinc-900">{mod.name}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-zinc-600">
                {mod.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
