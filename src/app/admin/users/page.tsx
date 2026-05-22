import Link from 'next/link';
import dbConnect from '@/lib/db/mongoose';
import { User } from '@/lib/models/user';
import { Workspace } from '@/lib/models/workspace';
import { DeleteUserButton } from './delete-button';

export const dynamic = 'force-dynamic';

export default async function UsersPage() {
  await dbConnect();

  const users = await User.find({}).sort({ createdAt: -1 });
  const workspaces = await Workspace.find({}).lean();

  const workspaceMap = new Map(workspaces.map((w) => [w._id.toString(), w.name]));

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Usuarios</h1>
          <p className="mt-1 text-sm text-slate-400">
            {users.length} usuario{users.length !== 1 ? 's' : ''} registrado
            {users.length !== 1 ? 's' : ''}.
          </p>
        </div>
        <button
          disabled
          title="La creación de usuarios desde aquí no está disponible temporalmente."
          className="w-fit cursor-not-allowed rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-slate-500"
        >
          + Crear usuario
        </button>
      </div>

      <div className="mt-8 overflow-hidden rounded-md border border-slate-800 bg-slate-900 sm:overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="max-sm:hidden">
            <tr className="border-b border-slate-800 bg-slate-950 text-left">
              <th className="px-6 py-3 font-medium text-slate-400">Nombre</th>
              <th className="px-6 py-3 font-medium text-slate-400">Email</th>
              <th className="px-6 py-3 font-medium text-slate-400">Rol</th>
              <th className="px-6 py-3 font-medium text-slate-400">Workspace</th>
              <th className="px-6 py-3 font-medium text-slate-400">Estado</th>
              <th className="px-6 py-3 font-medium text-slate-400">Acción</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                  No hay usuarios registrados.
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u._id.toString()} className="block border-b border-slate-800 p-4 sm:table-row sm:border-none sm:p-0">
                  <td className="block sm:table-cell sm:px-6 sm:py-4">
                    <span className="block text-xs text-slate-500 max-sm:mb-0.5 sm:hidden">Nombre</span>
                    <span className="font-medium text-white">{u.name}</span>
                  </td>
                  <td className="block sm:table-cell sm:px-6 sm:py-4">
                    <span className="block text-xs text-slate-500 max-sm:mb-0.5 sm:hidden">Email</span>
                    <span className="text-slate-400">{u.email}</span>
                  </td>
                  <td className="block sm:table-cell sm:px-6 sm:py-4">
                    <span className="block text-xs text-slate-500 max-sm:mb-0.5 sm:hidden">Rol</span>
                    <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-xs font-medium text-slate-400">
                      {u.role}
                    </span>
                  </td>
                  <td className="block sm:table-cell sm:px-6 sm:py-4">
                    <span className="block text-xs text-slate-500 max-sm:mb-0.5 sm:hidden">Workspace</span>
                    <span className="text-slate-400">
                      {u.workspace ? workspaceMap.get(u.workspace.toString()) ?? '—' : '—'}
                    </span>
                  </td>
                  <td className="block sm:table-cell sm:px-6 sm:py-4">
                    <span className="block text-xs text-slate-500 max-sm:mb-0.5 sm:hidden">Estado</span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        u.isActive
                          ? 'bg-emerald-500/10 text-emerald-500'
                          : 'bg-rose-500/10 text-rose-500'
                      }`}
                    >
                      {u.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="block sm:table-cell sm:px-6 sm:py-4">
                    <span className="block text-xs text-slate-500 max-sm:mb-0.5 sm:hidden">Acción</span>
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/admin/users/${u._id.toString()}`}
                        className="text-sm font-medium text-indigo-400 underline underline-offset-2 hover:text-white"
                      >
                        Editar
                      </Link>
                      <DeleteUserButton userId={u._id.toString()} userName={u.name} />
                    </div>
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
