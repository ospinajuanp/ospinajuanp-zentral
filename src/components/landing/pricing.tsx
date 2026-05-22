import dbConnect from '@/lib/db/mongoose';
import { Plan } from '@/lib/models/plan';
import { PricingCards } from './pricing-cards';

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

        <PricingCards plans={plans} />
      </div>
    </section>
  );
}
