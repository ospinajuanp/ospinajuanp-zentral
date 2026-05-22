import Link from 'next/link';
import dbConnect from '@/lib/db/mongoose';
import { User } from '@/lib/models/user';
import { Workspace } from '@/lib/models/workspace';

export default async function UsersPage() {
  await dbConnect();

  const users = await User.find({}).sort({ createdAt: -1 });
  const workspaces = await Workspace.find({}).lean();

  const workspaceMap = new Map(workspaces.map((w) => [w._id.toString(), w.name]));

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Usuarios</h1>
      <p className="mt-1 text-sm text-zinc-600">
        {users.length} usuario{users.length !== 1 ? 's' : ''} registrado
        {users.length !== 1 ? 's' : ''}.
      </p>

      <div className="mt-8 overflow-hidden rounded-2xl border border-zinc-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50 text-left">
              <th className="px-6 py-3 font-medium text-zinc-600">Nombre</th>
              <th className="px-6 py-3 font-medium text-zinc-600">Email</th>
              <th className="px-6 py-3 font-medium text-zinc-600">Rol</th>
              <th className="px-6 py-3 font-medium text-zinc-600">Workspace</th>
              <th className="px-6 py-3 font-medium text-zinc-600">Estado</th>
              <th className="px-6 py-3 font-medium text-zinc-600">Acción</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-zinc-500">
                  No hay usuarios registrados.
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u._id.toString()} className="border-b border-zinc-100">
                  <td className="px-6 py-4 font-medium text-zinc-900">{u.name}</td>
                  <td className="px-6 py-4 text-zinc-600">{u.email}</td>
                  <td className="px-6 py-4">
                    <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600">
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-zinc-600">
                    {u.workspace ? workspaceMap.get(u.workspace.toString()) ?? '—' : '—'}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        u.isActive
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-600'
                      }`}
                    >
                      {u.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      href={`/admin/users/${u._id.toString()}`}
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
