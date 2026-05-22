import dbConnect from '@/lib/db/mongoose';
import { Module } from '@/lib/models/module';
import { ModulesGridCards } from './modules-grid-cards';
import type { ModuleTier } from '@/types';

const statusOrder: Record<string, number> = { active: 0, coming_soon: 1, inactive: 2 };
const tierOrder: Record<string, number> = { free: 0, premium: 1 };

export async function ModulesGrid() {
  try {
    await dbConnect();
    const modules = await Module.find().sort({ key: 1 }).lean();

    modules.sort((a, b) => {
      const sa = statusOrder[a.status] ?? 2;
      const sb = statusOrder[b.status] ?? 2;
      if (sa !== sb) return sa - sb;
      const ta = tierOrder[a.tier] ?? 1;
      const tb = tierOrder[b.tier] ?? 1;
      return ta - tb;
    });

    const mapped = modules.map((mod) => ({
      key: mod.key,
      name: mod.name,
      description: mod.description,
      tier: mod.tier as ModuleTier,
      status: mod.status as 'active' | 'inactive' | 'coming_soon',
    }));

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

          <ModulesGridCards modules={mapped} />
        </div>
      </section>
    );
  } catch {
    return null;
  }
}
