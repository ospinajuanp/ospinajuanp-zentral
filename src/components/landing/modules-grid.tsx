import dbConnect from '@/lib/db/mongoose';
import { Module } from '@/lib/models/module';
import { ModulesGridCards } from './modules-grid-cards';
import type { ModuleTier } from '@/types';

const statusOrder: Record<string, number> = { active: 0, coming_soon: 1, inactive: 2 };
const tierOrder: Record<string, number> = { free: 0, premium: 1 };

export async function ModulesGrid() {
  try {
    await dbConnect();
    const rawModules = await Module.find().sort({ key: 1 }).lean()
      .then((docs) => JSON.parse(JSON.stringify(docs)));

    rawModules.sort((a: Record<string, unknown>, b: Record<string, unknown>) => {
      const sa = statusOrder[String(a.status)] ?? 2;
      const sb = statusOrder[String(b.status)] ?? 2;
      if (sa !== sb) return sa - sb;
      const ta = tierOrder[String(a.tier)] ?? 1;
      const tb = tierOrder[String(b.tier)] ?? 1;
      return ta - tb;
    });

    const mapped = rawModules.map((mod: Record<string, unknown>) => ({
      key: mod.key,
      name: mod.name,
      description: mod.description,
      tier: mod.tier as ModuleTier,
      status: mod.status as 'active' | 'inactive' | 'coming_soon',
    }));

    return (
      <section id="modulos" aria-labelledby="modules-heading" className="border-t border-slate-800 bg-slate-950 px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <h2 id="modules-heading" className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Modulos disponibles
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-slate-400">
              Cada modulo es independiente. Activalos segun las necesidades de tu negocio.
            </p>
          </div>

          <ModulesGridCards modules={mapped} />
        </div>
      </section>
    );
  } catch {
    return (
      <section id="modulos" className="border-t border-slate-800 bg-slate-950 px-6 py-24">
        <div className="mx-auto max-w-6xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Modulos disponibles
          </h2>
          <p className="mt-4 text-slate-400">
            No se pudieron cargar los modulos en este momento. Intenta de nuevo mas tarde.
          </p>
        </div>
      </section>
    );
  }
}
