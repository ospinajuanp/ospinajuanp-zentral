const plans = [
  {
    name: 'Free',
    price: '0',
    description: 'Para empezar a explorar Zentral.',
    features: ['1 workspace', 'Módulo TransferCheck gratis', 'Hasta 5 usuarios', 'Soporte por email'],
    cta: 'Empezar gratis',
    highlighted: false,
  },
  {
    name: 'Premium',
    price: 'Desde $9',
    description: 'Módulos avanzados para equipos en crecimiento.',
    features: [
      'Workspaces ilimitados',
      'Todos los módulos disponibles',
      'Usuarios ilimitados',
      'Soporte prioritario',
      'API pública',
    ],
    cta: 'Ver módulos',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: 'A medida',
    description: 'Solución personalizada para grandes volúmenes.',
    features: [
      'Todo lo de Premium',
      'Onboarding dedicado',
      'SLA garantizado',
      'Infraestructura dedicada',
      'Facturación personalizada',
    ],
    cta: 'Contactar',
    highlighted: false,
  },
];

export function Pricing() {
  return (
    <section id="precios" className="border-t border-slate-800 bg-slate-950 px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Planes flexibles
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-slate-400">
            Empieza gratis. Escala cuando lo necesites.
          </p>
        </div>

        <div className="mt-16 grid gap-8 lg:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative flex flex-col rounded-md border p-8 ${
                plan.highlighted
                  ? 'border-zinc-900 bg-zinc-900 text-white shadow-xl'
                  : 'border-slate-800 bg-slate-900'
              }`}
            >
              {plan.highlighted && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-zinc-800 px-4 py-1 text-xs font-medium text-zinc-300">
                  Más popular
                </span>
              )}

              <h3 className={`text-lg font-semibold ${plan.highlighted ? 'text-white' : 'text-white'}`}>
                {plan.name}
              </h3>
              <p className={`mt-1 text-sm ${plan.highlighted ? 'text-zinc-400' : 'text-slate-400'}`}>
                {plan.description}
              </p>

              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-4xl font-bold">{plan.price}</span>
                {plan.name !== 'Enterprise' && (
                  <span className={`text-sm ${plan.highlighted ? 'text-zinc-400' : 'text-slate-500'}`}>
                    /mes
                  </span>
                )}
              </div>

              <ul className="mt-8 flex-1 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm">
                    <svg
                      className={`mt-0.5 h-4 w-4 flex-shrink-0 ${
                        plan.highlighted ? 'text-emerald-400' : 'text-emerald-500'
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                className={`mt-8 w-full rounded-md py-3 text-sm font-medium transition-all ${
                  plan.highlighted
                    ? 'bg-white text-zinc-900 hover:bg-zinc-100'
                    : 'border border-slate-700 text-slate-200 hover:bg-slate-800'
                }`}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
