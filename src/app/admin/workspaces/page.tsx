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
      <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Workspaces</h1>
      <p className="mt-1 text-sm text-zinc-600">
        {workspaces.length} workspace{workspaces.length !== 1 ? 's' : ''} registrado
        {workspaces.length !== 1 ? 's' : ''}.
      </p>

      <div className="mt-8 overflow-hidden rounded-2xl border border-zinc-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50 text-left">
              <th className="px-6 py-3 font-medium text-zinc-600">Nombre</th>
              <th className="px-6 py-3 font-medium text-zinc-600">Slug</th>
              <th className="px-6 py-3 font-medium text-zinc-600">Admin</th>
              <th className="px-6 py-3 font-medium text-zinc-600">Estado</th>
              <th className="px-6 py-3 font-medium text-zinc-600">Acción</th>
            </tr>
          </thead>
          <tbody>
            {workspaces.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">
                  No hay workspaces registrados.
                </td>
              </tr>
            ) : (
              workspaces.map((ws) => (
                <tr key={ws._id.toString()} className="border-b border-zinc-100">
                  <td className="px-6 py-4 font-medium text-zinc-900">{ws.name}</td>
                  <td className="px-6 py-4 text-zinc-600">{ws.slug}</td>
                  <td className="px-6 py-4 text-zinc-600">
                    {(ws.owner as unknown as { name: string; email: string })?.name ?? '—'}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        ws.isActive
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-600'
                      }`}
                    >
                      {ws.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      href={`/admin/workspaces/${ws._id.toString()}`}
                      className="text-sm font-medium text-zinc-700 underline underline-offset-2 hover:text-zinc-900"
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
