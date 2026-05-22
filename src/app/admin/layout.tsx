import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import Link from 'next/link';
import SessionTimeout from '@/components/session-timeout';
import LogoutButton from '@/components/logout-button';
import { NavLink } from '@/components/nav-link';
import { SidebarShell } from '@/components/sidebar-shell';
import { HomeIcon, BuildingIcon, ModuleIcon, PriceIcon, UsersIcon } from '@/components/icons';

const bottomNav = [
  { label: 'Dashboard', href: '/admin', icon: <HomeIcon />, exact: true },
  { label: 'Workspaces', href: '/admin/workspaces', icon: <BuildingIcon /> },
  { label: 'Módulos', href: '/admin/modules', icon: <ModuleIcon /> },
  { label: 'Planes', href: '/admin/plans', icon: <PriceIcon /> },
  { label: 'Usuarios', href: '/admin/users', icon: <UsersIcon /> },
];

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
      <SidebarShell
        bottomNav={bottomNav}
        sidebar={
          <>
            <div className="border-b border-slate-800 px-6 py-5">
              <Link href="/admin" className="text-lg font-bold tracking-tight text-white">
                Zentral Admin
              </Link>
            </div>

            <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
              <NavLink href="/admin" exact>Dashboard</NavLink>
              <NavLink href="/admin/workspaces">Workspaces</NavLink>
              <NavLink href="/admin/modules">Módulos</NavLink>
              <NavLink href="/admin/plans">Planes</NavLink>
              <NavLink href="/admin/users">Usuarios</NavLink>
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
          </>
        }
      >
        {children}
      </SidebarShell>
    </SessionTimeout>
  );
}
