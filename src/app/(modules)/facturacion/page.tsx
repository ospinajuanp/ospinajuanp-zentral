import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import dbConnect from '@/lib/db/mongoose';
import { ModuleSubscription } from '@/lib/models/module-subscription';

export default async function FacturacionPage() {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  let subs = null;

  if (session.role !== 'superadmin') {
    await dbConnect();

    subs = await ModuleSubscription.find({
      workspace: session.workspaceId,
      moduleKey: 'facturacion',
      status: 'active',
    }).lean();

    if (!subs.length) {
      redirect('/dashboard');
    }
  }

  let quota = null;
  if (subs) {
    let used = 0;
    let total = 0;
    for (const s of subs) {
      used += s.usedQuota ?? 0;
      total += s.monthlyQuota ?? 0;
    }
    quota = {
      used,
      total,
      remaining: total <= 0 ? -1 : total - used,
      unlimited: total <= 0,
    };
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <h1 className="text-3xl font-bold tracking-tight text-white">
        Facturacion Electronica
      </h1>
      <p className="mt-2 text-slate-400">
        Gestion de facturacion electronica y seguimiento de pagos.
      </p>

      {quota && (
        <div className="mt-6 rounded-md border border-slate-800 bg-slate-900 px-5 py-4">
          <p className="text-sm font-medium text-slate-300">Cuota mensual</p>
          <p className="mt-1 text-2xl font-bold text-white">
            {quota.unlimited
              ? 'Ilimitada'
              : `${quota.used.toLocaleString()} / ${quota.total.toLocaleString()}`}
          </p>
          {!quota.unlimited && (
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-2 rounded-full bg-indigo-600 transition-all"
                style={{ width: `${Math.min(100, (quota.used / quota.total) * 100)}%` }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
