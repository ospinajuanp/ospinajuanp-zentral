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
    <section id="modulos" className="border-t border-slate-800 bg-slate-950 px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Módulos disponibles
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-slate-400">
            Cada módulo es independiente. Actívalos según las necesidades de tu negocio.
          </p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {modules.map((mod) => (
            <div
              key={mod.slug}
              className="flex flex-col rounded-md border border-slate-800 bg-slate-900 p-6 transition-shadow hover:shadow-indigo-500/10"
            >
              <div className="flex items-center justify-between">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    mod.tier === 'free'
                      ? 'bg-emerald-500/10 text-emerald-500'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {mod.tier === 'free' ? 'Gratis' : 'Premium'}
                </span>
                <span
                  className={`text-xs font-medium ${
                    mod.status === 'Activo' ? 'text-emerald-500' : 'text-slate-500'
                  }`}
                >
                  {mod.status}
                </span>
              </div>

              <h3 className="mt-4 text-lg font-semibold text-white">{mod.name}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-400">
                {mod.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
