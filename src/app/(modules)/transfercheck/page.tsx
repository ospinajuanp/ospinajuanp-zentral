import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import dbConnect from '@/lib/db/mongoose';
import { ModuleSubscription } from '@/lib/models/module-subscription';

export default async function TransferCheckPage() {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  if (session.role !== 'superadmin') {
    await dbConnect();

    const subscription = await ModuleSubscription.findOne({
      workspace: session.workspaceId,
      moduleKey: 'transfercheck',
      status: 'active',
    });

    if (!subscription) {
      redirect('/dashboard');
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
        TransferCheck
      </h1>
      <p className="mt-2 text-zinc-600">
        Módulo de verificación y validación de transferencias bancarias.
      </p>
    </div>
  );
}
