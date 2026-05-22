import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import Link from 'next/link';
import SessionTimeout from '@/components/session-timeout';
import LogoutButton from '@/components/logout-button';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  if (session.role !== 'superadmin') {
    redirect('/dashboard');
  }

  return (
    <SessionTimeout>
      <div className="flex min-h-screen">
        <aside className="flex w-64 flex-col border-r border-slate-800 bg-slate-900">
          <div className="border-b border-slate-800 px-6 py-5">
            <Link href="/admin" className="text-lg font-bold tracking-tight text-white">
              Zentral Admin
            </Link>
          </div>

          <nav className="flex-1 space-y-1 px-3 py-4">
            <Link
              href="/admin"
              className="block rounded-md px-3 py-2 text-sm font-medium text-slate-400 transition-colors hover:bg-slate-800"
            >
              Dashboard
            </Link>
            <Link
              href="/admin/workspaces"
              className="block rounded-md px-3 py-2 text-sm font-medium text-slate-400 transition-colors hover:bg-slate-800"
            >
              Workspaces
            </Link>
            <Link
              href="/admin/users"
              className="block rounded-md px-3 py-2 text-sm font-medium text-slate-400 transition-colors hover:bg-slate-800"
            >
              Usuarios
            </Link>
          </nav>

          <div className="border-t border-slate-800 px-3 py-4 space-y-1">
            <Link
              href="/dashboard"
              className="block rounded-md px-3 py-2 text-sm text-slate-500 transition-colors hover:bg-slate-800"
            >
              ← Volver al Dashboard
            </Link>
            <LogoutButton />
          </div>
        </aside>

        <main className="flex-1 bg-slate-950 px-8 py-8">{children}</main>
      </div>
    </SessionTimeout>
  );
}
