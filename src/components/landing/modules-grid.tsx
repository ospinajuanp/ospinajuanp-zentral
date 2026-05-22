import dbConnect from '@/lib/db/mongoose';
import { Module } from '@/lib/models/module';

export async function ModulesGrid() {
  await dbConnect();
  const modules = await Module.find().sort({ key: 1 }).lean();

  const statusOrder: Record<string, number> = { active: 0, coming_soon: 1, inactive: 2 };
  const tierOrder: Record<string, number> = { free: 0, premium: 1 };

  modules.sort((a, b) => {
    const sa = statusOrder[a.status] ?? 2;
    const sb = statusOrder[b.status] ?? 2;
    if (sa !== sb) return sa - sb;
    const ta = tierOrder[a.tier] ?? 1;
    const tb = tierOrder[b.tier] ?? 1;
    return ta - tb;
  });

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
          {modules.map((mod) => {
            const statusLabel =
              mod.status === 'active' ? 'Activo' :
              mod.status === 'coming_soon' ? 'Próximamente' :
              'Inactivo';

            return (
              <div
                key={mod.key}
                className="flex flex-col rounded-md border border-slate-800 bg-slate-900 p-6 transition-shadow hover:shadow-indigo-500/10"
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      mod.tier === 'free'
                        ? 'bg-emerald-500/10 text-emerald-500'
                        : 'bg-indigo-500/10 text-indigo-400'
                    }`}
                  >
                    {mod.tier === 'free' ? 'Gratis' : 'Premium'}
                  </span>
                  <span
                    className={`text-xs font-medium ${
                      mod.status === 'active' ? 'text-emerald-500' :
                      mod.status === 'coming_soon' ? 'text-amber-400' :
                      'text-slate-500'
                    }`}
                  >
                    {statusLabel}
                  </span>
                </div>

                <h3 className="mt-4 text-lg font-semibold text-white">{mod.name}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-400">
                  {mod.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
