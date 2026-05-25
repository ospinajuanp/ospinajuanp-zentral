import { getSession } from '@/lib/auth';
import dbConnect from '@/lib/db/mongoose';
import { ModuleSubscription } from '@/lib/models/module-subscription';
import Link from 'next/link';
import SessionTimeout from '@/components/session-timeout';
import LogoutButton from '@/components/logout-button';
import { NavLink } from '@/components/nav-link';
import { SidebarShell } from '@/components/sidebar-shell';
import { HomeIcon, UsersIcon, GearIcon, PriceIcon } from '@/components/icons';
import type { ReactNode } from 'react';

interface ProtectedLayoutProps {
  children: React.ReactNode;
  title: string;
  dashboardHref: string;
  homeLink?: string;
  homeLabel?: string;
}

export default async function ProtectedLayout({
  children,
  title,
  dashboardHref,
  homeLink = '/',
  homeLabel = 'Volver al sitio',
}: ProtectedLayoutProps) {
  const session = await getSession();

  if (!session) {
    const { redirect } = await import('next/navigation');
    redirect('/login');
  }

  const { role, workspaceId } = session!;
  const isAdmin = role === 'admin';

  let modules: { moduleKey: string; tier: string }[] = [];
  if (role !== 'superadmin' && workspaceId) {
    try {
      await dbConnect();
      modules = await ModuleSubscription.find(
        { workspace: workspaceId, status: 'active' },
        'moduleKey tier'
      ).lean();
    } catch {
      // non-blocking — modules sidebar is optional
    }
  }

  const bottomNav: { label: string; href: string; icon: ReactNode }[] = [
    { label: 'Dashboard', href: dashboardHref, icon: <HomeIcon /> },
  ];

  if (isAdmin) {
    bottomNav.push(
      { label: 'Usuarios', href: '/users', icon: <UsersIcon /> },
      { label: 'Planes', href: '/workspace/plan', icon: <PriceIcon /> },
      { label: 'Workspace', href: '/workspace', icon: <GearIcon /> },
    );
  }

  return (
    <SessionTimeout>
      <SidebarShell
        bottomNav={bottomNav}
        sidebar={
          <>
            <div className="border-b border-slate-800 px-6 py-5">
              <Link href={dashboardHref} className="text-lg font-bold tracking-tight text-white">
                {title}
              </Link>
            </div>

            <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
              <NavLink href={dashboardHref} exact>Dashboard</NavLink>

              {isAdmin && (
                <>
                  <NavLink href="/users">Usuarios</NavLink>
                  <NavLink href="/workspace/plan">Planes</NavLink>
                  <NavLink href="/workspace" exact>Workspace</NavLink>
                </>
              )}

              {modules.length > 0 && (
                <>
                  <div className="my-3 border-t border-slate-800" />
                  <p className="px-3 pb-1 text-xs font-medium uppercase tracking-wider text-slate-600">
                    Módulos
                  </p>
                  {modules.map((mod) => (
                    <NavLink key={mod.moduleKey} href={`/${mod.moduleKey}`}>
                      {mod.moduleKey}
                    </NavLink>
                  ))}
                </>
              )}
            </nav>

            <div className="border-t border-slate-800 px-3 py-4 space-y-1">
              <Link
                href={homeLink}
                className="block rounded-md px-3 py-2 text-sm text-slate-500 transition-colors hover:bg-slate-800"
              >
                ← {homeLabel}
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
