import dbConnect from '@/lib/db/mongoose';
import { Plan } from '@/lib/models/plan';

export async function Pricing() {
  await dbConnect();
  const plans = await Plan.find({ isActive: true })
    .populate('includedModules.module', 'name key defaultQuota')
    .sort({ sortOrder: 1, name: 1 })
    .then((docs) => JSON.parse(JSON.stringify(docs)));

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
          {plans.map((plan: Record<string, unknown>) => {
            const p = plan as {
              _id: string; name: string; price: string; description: string;
              cta: string; highlighted: boolean; maxUsers: number;
              ctaLink: string;
              extraFeatures: string[];
              includedModules?: Array<{
                module: { name: string; key: string; defaultQuota: number };
                quotaOverride: number | null;
              }>;
            };

            const includedModules = (p.includedModules ?? []) as Array<{
                module: { name: string; key: string; defaultQuota: number };
                quotaOverride: number | null;
              }>;

            const moduleNames = includedModules.map((im) => im.module?.name).filter(Boolean).join(', ');
            const totalQuota = includedModules.reduce(
              (s, im) => s + (im.quotaOverride ?? im.module?.defaultQuota ?? 0), 0
            );
            const features: string[] = [
              `Módulos: ${moduleNames}`,
              `${p.maxUsers} usuario${p.maxUsers !== 1 ? 's' : ''}`,
              p.maxUsers === 0 ? 'Usuarios ilimitados' : '',
              ...(totalQuota > 0
                ? [`Hasta ${totalQuota} consultas / mes en total`]
                : ['Consultas ilimitadas']),
              ...p.extraFeatures,
            ].filter(Boolean);

            const isEnterprise = p.price === 'A medida' || p.price === 'Personalizado';

            return (
              <div
                key={p._id}
                className={`relative flex flex-col rounded-md border p-8 ${
                  p.highlighted
                    ? 'border-zinc-900 bg-zinc-900 text-white shadow-xl'
                    : 'border-slate-800 bg-slate-900'
                }`}
              >
                {p.highlighted && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-zinc-800 px-4 py-1 text-xs font-medium text-zinc-300">
                    Más popular
                  </span>
                )}

                <h3 className="text-lg font-semibold text-white">{p.name}</h3>
                <p className={`mt-1 text-sm ${p.highlighted ? 'text-zinc-400' : 'text-slate-400'}`}>
                  {p.description}
                </p>

                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-4xl font-bold">{p.price}</span>
                  {!isEnterprise && (
                    <span className={`text-sm ${p.highlighted ? 'text-zinc-400' : 'text-slate-500'}`}>
                      /mes
                    </span>
                  )}
                </div>

                <ul className="mt-8 flex-1 space-y-3">
                  {features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm">
                      <svg
                        className={`mt-0.5 h-4 w-4 flex-shrink-0 ${
                          p.highlighted ? 'text-emerald-400' : 'text-emerald-500'
                        }`}
                        fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>

                <a
                  href={p.ctaLink || '#'}
                  className={`mt-8 block w-full rounded-md py-3 text-center text-sm font-medium transition-all ${
                    p.highlighted
                      ? 'bg-white text-zinc-900 hover:bg-zinc-100'
                      : 'border border-slate-700 text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  {p.cta}
                </a>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
