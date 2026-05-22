import Link from 'next/link';
import dbConnect from '@/lib/db/mongoose';
import { Workspace } from '@/lib/models/workspace';

export default async function WorkspacesPage() {
  await dbConnect();

  const workspaces = await Workspace.find({})
    .sort({ createdAt: -1 })
    .populate('owner', 'name email');

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-white">Workspaces</h1>
      <p className="mt-1 text-sm text-slate-400">
        {workspaces.length} workspace{workspaces.length !== 1 ? 's' : ''} registrado
        {workspaces.length !== 1 ? 's' : ''}.
      </p>

      <div className="mt-8 overflow-hidden rounded-md border border-slate-800 bg-slate-900">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950 text-left">
              <th className="px-6 py-3 font-medium text-slate-400">Nombre</th>
              <th className="px-6 py-3 font-medium text-slate-400">Slug</th>
              <th className="px-6 py-3 font-medium text-slate-400">Admin</th>
              <th className="px-6 py-3 font-medium text-slate-400">Estado</th>
              <th className="px-6 py-3 font-medium text-slate-400">Acción</th>
            </tr>
          </thead>
          <tbody>
            {workspaces.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                  No hay workspaces registrados.
                </td>
              </tr>
            ) : (
              workspaces.map((ws) => (
                <tr key={ws._id.toString()} className="border-b border-slate-800">
                  <td className="px-6 py-4 font-medium text-white">{ws.name}</td>
                  <td className="px-6 py-4 text-slate-400">{ws.slug}</td>
                  <td className="px-6 py-4 text-slate-400">
                    {(ws.owner as unknown as { name: string; email: string })?.name ?? '—'}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        ws.isActive
                          ? 'bg-emerald-500/10 text-emerald-500'
                          : 'bg-rose-500/10 text-rose-500'
                      }`}
                    >
                      {ws.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      href={`/admin/workspaces/${ws._id.toString()}`}
                      className="text-sm font-medium text-slate-400 underline underline-offset-2 hover:text-white"
                    >
                      Ver detalle
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
