import dbConnect from '@/lib/db/mongoose';
import { Module } from '@/lib/models/module';

export async function Pricing() {
  await dbConnect();
  const modules = await Module.find({ status: { $ne: 'inactive' } }).sort({ key: 1 }).lean();

  const freeModules = modules.filter((m) => m.tier === 'free');
  const premiumModules = modules.filter((m) => m.tier === 'premium');

  const freeQuotaAvg = freeModules.length > 0
    ? Math.round(freeModules.reduce((s, m) => s + m.defaultQuota, 0) / freeModules.length)
    : 0;
  const premiumQuotaAvg = premiumModules.length > 0
    ? Math.round(premiumModules.reduce((s, m) => s + m.defaultQuota, 0) / premiumModules.length)
    : 0;

  const freeNames = freeModules.map((m) => m.name).join(', ');
  const premiumNames = premiumModules.map((m) => m.name).join(', ');

  const plans = [
    {
      name: 'Free',
      price: '0',
      description: 'Para empezar a usar Zentral.',
      features: [
        `Módulos: ${freeNames}`,
        '1 usuario',
        `Hasta ${freeQuotaAvg} consultas / mes por módulo`,
      ],
      cta: 'Empezar gratis',
      highlighted: false,
    },
    {
      name: 'Premium',
      price: '$12',
      description: 'Para equipos que necesitan más.',
      features: [
        `Módulos: ${premiumNames}`,
        '5 usuarios',
        `Hasta ${premiumQuotaAvg} consultas / mes por módulo`,
        'Soporte por email',
        'Módulos en beta gratis',
      ],
      cta: 'Ver módulos',
      highlighted: true,
    },
    {
      name: 'Enterprise',
      price: 'A medida',
      description: 'Solución personalizada para tu negocio.',
      features: [
        'Todos los módulos disponibles',
        'Usuarios ilimitados',
        'Consultas ilimitadas',
        'Soporte prioritario',
        'Factura personalizada',
        'Onboarding dedicado',
        'SLA estándar (48-72 h)',
      ],
      cta: 'Contactar',
      highlighted: false,
    },
  ];
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
                        aria-hidden="true"
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
